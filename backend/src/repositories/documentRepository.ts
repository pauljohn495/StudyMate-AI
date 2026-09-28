import type { ResultSetHeader, RowDataPacket } from '../config/database.js';
import { db } from '../config/database.js';
import type { DocumentChunkInput, DocumentRow, DocumentStatus } from '../types/documents.js';

export const listDocuments = async (lessonId: string, userId: string) => {
  const [rows] = await db.query<(DocumentRow & RowDataPacket)[]>(
    `SELECT d.id, d.lesson_id, d.original_name, d.mime_type, d.size_bytes, d.status, d.error_message,
      d.created_at, d.updated_at, COUNT(dc.id) AS chunk_count
     FROM documents d JOIN lessons l ON l.id=d.lesson_id JOIN subjects s ON s.id=l.subject_id
     LEFT JOIN document_chunks dc ON dc.document_id=d.id
     WHERE d.lesson_id=? AND s.user_id=? GROUP BY d.id ORDER BY d.created_at DESC`, [lessonId, userId]
  );
  return rows;
};

export const listAllDocuments = async (userId: string) => {
  const [rows] = await db.query<(DocumentRow & RowDataPacket & { lesson_title: string; subject_id: string; subject_name: string })[]>(
    `SELECT d.id, d.lesson_id, d.original_name, d.mime_type, d.size_bytes, d.status, d.error_message,
      d.created_at, d.updated_at, l.title AS lesson_title, s.id AS subject_id, s.name AS subject_name,
      COUNT(dc.id) AS chunk_count
     FROM documents d JOIN lessons l ON l.id=d.lesson_id JOIN subjects s ON s.id=l.subject_id
     LEFT JOIN document_chunks dc ON dc.document_id=d.id
     WHERE s.user_id=? GROUP BY d.id,l.title,s.id,s.name ORDER BY d.created_at DESC`, [userId]
  );
  return rows;
};

export const findDocument = async (id: string, userId: string) => {
  const [rows] = await db.query<(DocumentRow & RowDataPacket)[]>(
    `SELECT d.*, COUNT(dc.id) AS chunk_count FROM documents d
     JOIN lessons l ON l.id=d.lesson_id JOIN subjects s ON s.id=l.subject_id
     LEFT JOIN document_chunks dc ON dc.document_id=d.id
     WHERE d.id=? AND s.user_id=? GROUP BY d.id LIMIT 1`, [id, userId]
  );
  return rows[0] ?? null;
};

export const countUploadsToday = async (userId: string) => {
  const [rows] = await db.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) total FROM documents d JOIN lessons l ON l.id=d.lesson_id JOIN subjects s ON s.id=l.subject_id
     WHERE s.user_id=? AND d.created_at >= CURRENT_DATE`, [userId]
  );
  return Number(rows[0]?.total ?? 0);
};

export const insertDocument = async (document: Pick<DocumentRow, 'id'|'lesson_id'|'original_name'|'storage_key'|'mime_type'|'size_bytes'|'content_hash'>) => {
  await db.execute<ResultSetHeader>(
    `INSERT INTO documents (id, lesson_id, original_name, storage_key, mime_type, size_bytes, content_hash, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'uploading')`,
    [document.id, document.lesson_id, document.original_name, document.storage_key, document.mime_type, document.size_bytes, document.content_hash]
  );
};

export const updateDocumentStatus = async (id: string, status: DocumentStatus, errorMessage: string | null = null) => {
  await db.execute<ResultSetHeader>('UPDATE documents SET status=?, error_message=? WHERE id=?', [status, errorMessage, id]);
};

export const saveExtraction = async (documentId: string, lessonId: string, text: string, chunks: DocumentChunkInput[]) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE documents SET extracted_text=?, status=\'ready\', error_message=NULL WHERE id=?', [text, documentId]);
    await connection.execute('DELETE FROM document_chunks WHERE document_id=?', [documentId]);
    for (const chunk of chunks) {
      await connection.execute(
        `INSERT INTO document_chunks (id, document_id, chunk_index, heading, content, page_number, token_estimate)
         VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?)`,
        [documentId, chunk.chunkIndex, chunk.heading, chunk.content, chunk.pageNumber, chunk.tokenEstimate]
      );
    }
    await connection.execute('UPDATE lessons SET processing_status=\'ready\' WHERE id=?', [lessonId]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
};

export const setLessonStatus = async (lessonId: string, status: 'empty'|'uploading'|'processing'|'ready'|'failed') => {
  await db.execute<ResultSetHeader>('UPDATE lessons SET processing_status=? WHERE id=?', [status, lessonId]);
};

export const getDocumentChunks = async (documentId: string) => {
  const [rows] = await db.query<(RowDataPacket & { id: string; chunk_index: number; heading: string | null; content: string; page_number: number | null; token_estimate: number })[]>(
    'SELECT id, chunk_index, heading, content, page_number, token_estimate FROM document_chunks WHERE document_id=? ORDER BY chunk_index', [documentId]
  );
  return rows;
};

export const deleteDocument = async (id: string, userId: string) => {
  const document = await findDocument(id, userId);
  if (!document) return null;
  await db.execute<ResultSetHeader>('DELETE FROM documents WHERE id=?', [id]);
  const [rows] = await db.query<(RowDataPacket & { remaining: number })[]>('SELECT COUNT(*) remaining FROM documents WHERE lesson_id=?', [document.lesson_id]);
  if (Number(rows[0]?.remaining ?? 0) === 0) await setLessonStatus(document.lesson_id, 'empty');
  return document;
};
