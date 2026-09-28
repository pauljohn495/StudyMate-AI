import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { limits } from '../config/env.js';
import * as documents from '../repositories/documentRepository.js';
import { findLesson } from '../repositories/lessonRepository.js';
import { chunkDocument, contentHash, extractDocument, storageKeyFor, validateDocument } from '../services/documentService.js';
import { fileStorage } from '../services/fileService.js';
import { ApiError } from '../utils/ApiError.js';

const publicDocument = (document: NonNullable<Awaited<ReturnType<typeof documents.findDocument>>>) => ({
  id: document.id, lesson_id: document.lesson_id, original_name: document.original_name, mime_type: document.mime_type,
  size_bytes: Number(document.size_bytes), status: document.status, error_message: document.error_message,
  chunk_count: Number(document.chunk_count ?? 0), created_at: document.created_at, updated_at: document.updated_at
});

export const list: RequestHandler = async (request, response) => {
  const lessonId = String(request.params.id);
  if (!(await findLesson(lessonId, request.user!.id))) throw new ApiError(404, 'Lesson not found.', 'LESSON_NOT_FOUND');
  const items = await documents.listDocuments(lessonId, request.user!.id);
  response.json({ success: true, data: items.map((item) => ({ ...item, size_bytes: Number(item.size_bytes), chunk_count: Number(item.chunk_count ?? 0) })) });
};

export const listAll: RequestHandler = async (request, response) => {
  const items = await documents.listAllDocuments(request.user!.id);
  response.json({ success: true, data: items.map((item) => ({ ...item, size_bytes: Number(item.size_bytes), chunk_count: Number(item.chunk_count ?? 0) })) });
};

export const upload: RequestHandler = async (request, response) => {
  const lessonId = String(request.params.id);
  if (!(await findLesson(lessonId, request.user!.id))) throw new ApiError(404, 'Lesson not found.', 'LESSON_NOT_FOUND');
  if (!request.file) throw new ApiError(422, 'Choose a PDF, DOCX, PPTX, or TXT file to upload.', 'FILE_REQUIRED');
  if (await documents.countUploadsToday(request.user!.id) >= limits.uploads) throw new ApiError(429, `Daily upload limit reached (${limits.uploads}). Try again tomorrow.`, 'UPLOAD_DAILY_LIMIT');
  const validation = await validateDocument(request.file);
  const id = randomUUID();
  const storageKey = storageKeyFor(request.user!.id, lessonId, validation.extension);
  const hash = contentHash(request.file.buffer);
  await fileStorage.save(storageKey, request.file.buffer, validation.detectedMime);
  try {
    await documents.insertDocument({ id, lesson_id: lessonId, original_name: request.file.originalname, storage_key: storageKey, mime_type: validation.detectedMime, size_bytes: request.file.size, content_hash: hash });
    await documents.setLessonStatus(lessonId, 'processing');
    await documents.updateDocumentStatus(id, 'processing');
    const extracted = await extractDocument(request.file.buffer, validation.extension);
    const chunks = chunkDocument(extracted.sections.length ? extracted.sections : [{ content: extracted.text }]);
    await documents.saveExtraction(id, lessonId, extracted.text, chunks);
    const saved = await documents.findDocument(id, request.user!.id);
    response.status(201).json({ success: true, data: { ...publicDocument(saved!), page_count: extracted.pageCount, warnings: extracted.warnings } });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'Document processing failed.';
    await documents.updateDocumentStatus(id, 'failed', message).catch(() => undefined);
    await documents.setLessonStatus(lessonId, 'failed').catch(() => undefined);
    if (error instanceof ApiError) throw error;
    throw new ApiError(422, 'The file was uploaded but its text could not be extracted.', 'DOCUMENT_EXTRACTION_FAILED');
  }
};

export const get: RequestHandler = async (request, response) => {
  const document = await documents.findDocument(String(request.params.id), request.user!.id);
  if (!document) throw new ApiError(404, 'Document not found.', 'DOCUMENT_NOT_FOUND');
  response.json({ success: true, data: publicDocument(document) });
};

export const content: RequestHandler = async (request, response) => {
  const document = await documents.findDocument(String(request.params.id), request.user!.id);
  if (!document) throw new ApiError(404, 'Document not found.', 'DOCUMENT_NOT_FOUND');
  if (document.status !== 'ready') throw new ApiError(409, 'Document text is not ready yet.', 'DOCUMENT_NOT_READY');
  response.json({ success: true, data: { document: publicDocument(document), text: document.extracted_text, chunks: await documents.getDocumentChunks(document.id) } });
};

export const download: RequestHandler = async (request, response) => {
  const document = await documents.findDocument(String(request.params.id), request.user!.id);
  if (!document) throw new ApiError(404, 'Document not found.', 'DOCUMENT_NOT_FOUND');
  const data=await fileStorage.read(document.storage_key);
  response.setHeader('Content-Type',document.mime_type);
  response.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(document.original_name)}`);
  response.send(data);
};

export const remove: RequestHandler = async (request, response) => {
  const document = await documents.deleteDocument(String(request.params.id), request.user!.id);
  if (!document) throw new ApiError(404, 'Document not found.', 'DOCUMENT_NOT_FOUND');
  await fileStorage.delete(document.storage_key);
  response.status(204).send();
};
