import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../config/database.js';
import type { AiFeature, ReviewerDifficulty, ReviewerType, SummaryLength } from '../types/ai.js';

export interface SourceChunk extends RowDataPacket { id: string; content: string; heading: string | null; page_number: number | null; chunk_index: number; document_name: string; }

export const getLessonSourceChunks = async (lessonId: string, userId: string) => {
  const [rows] = await db.query<SourceChunk[]>(
    `SELECT dc.id, dc.content, dc.heading, dc.page_number, dc.chunk_index, d.original_name AS document_name
     FROM document_chunks dc JOIN documents d ON d.id=dc.document_id
     JOIN lessons l ON l.id=d.lesson_id JOIN subjects s ON s.id=l.subject_id
     WHERE l.id=? AND s.user_id=? AND d.status='ready' ORDER BY d.created_at, dc.chunk_index`, [lessonId, userId]
  );
  return rows;
};

export const usageCountToday = async (userId: string, feature: AiFeature) => {
  const [rows] = await db.query<(RowDataPacket & { total: number })[]>(
    'SELECT COALESCE(SUM(request_count),0) total FROM ai_usage WHERE user_id=? AND feature=? AND successful=TRUE AND created_at >= UTC_DATE()', [userId, feature]
  );
  return Number(rows[0]?.total ?? 0);
};

export const recordUsage = async (input: { userId: string; feature: AiFeature; inputTokens: number | null; outputTokens: number | null; model: string; successful: boolean; errorCode?: string }) => {
  await db.execute<ResultSetHeader>(
    `INSERT INTO ai_usage (id,user_id,feature,request_count,input_tokens,output_tokens,model,successful,error_code)
     VALUES (UUID(),?,?,?,?,?,?,?,?)`,
    [input.userId,input.feature,1,input.inputTokens,input.outputTokens,input.model,input.successful,input.errorCode??null]
  );
};

export const replaceTopics = async (lessonId: string, names: string[]) => {
  const connection = await db.getConnection();
  try { await connection.beginTransaction(); await connection.execute('DELETE FROM topics WHERE lesson_id=?',[lessonId]);
    for (const name of names) await connection.execute('INSERT INTO topics (id,lesson_id,name) VALUES (UUID(),?,?)',[lessonId,name]);
    await connection.commit();
  } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
};

export const listTopics = async (lessonId: string, userId: string) => {
  const [rows] = await db.query<(RowDataPacket & { id:string; name:string; created_at:Date })[]>(
    'SELECT t.id,t.name,t.created_at FROM topics t JOIN lessons l ON l.id=t.lesson_id JOIN subjects s ON s.id=l.subject_id WHERE t.lesson_id=? AND s.user_id=? ORDER BY t.name',[lessonId,userId]
  ); return rows;
};

export const findCachedReviewer = async (lessonId:string,userId:string,generationKey:string) => {
  const [rows]=await db.query<(RowDataPacket & ReviewerRecord)[]>(
    `SELECT r.* FROM reviewers r JOIN lessons l ON l.id=r.lesson_id JOIN subjects s ON s.id=l.subject_id
     WHERE r.lesson_id=? AND s.user_id=? AND r.generation_key=? ORDER BY r.created_at DESC LIMIT 1`,[lessonId,userId,generationKey]); return rows[0]??null;
};

export interface ReviewerRecord { id:string;lesson_id:string;title:string;reviewer_type:ReviewerType;difficulty:ReviewerDifficulty;original_wording:number|boolean;content:string;source_version:string;generation_key:string;created_at:Date;updated_at:Date }
export interface SummaryRecord { id:string;lesson_id:string;title:string;summary_length:SummaryLength;content:string;source_version:string;generation_key:string;created_at:Date;updated_at:Date }

export const insertReviewer = async (record: ReviewerRecord) => {
  await db.execute<ResultSetHeader>(`INSERT INTO reviewers (id,lesson_id,title,reviewer_type,difficulty,original_wording,content,source_version,generation_key)
    VALUES (?,?,?,?,?,?,?,?,?)`,[record.id,record.lesson_id,record.title,record.reviewer_type,record.difficulty,record.original_wording,record.content,record.source_version,record.generation_key]);
};

export const listReviewers = async (userId:string,lessonId?:string) => {
  const values: string[]=[userId]; const lessonFilter=lessonId?' AND r.lesson_id=?':''; if(lessonId)values.push(lessonId);
  const [rows]=await db.query<(RowDataPacket & ReviewerRecord & {lesson_title:string;subject_name:string})[]>(
    `SELECT r.*,l.title lesson_title,s.name subject_name FROM reviewers r JOIN lessons l ON l.id=r.lesson_id JOIN subjects s ON s.id=l.subject_id
     WHERE s.user_id=?${lessonFilter} ORDER BY r.updated_at DESC`,values);return rows;
};

export const findCachedSummary = async (lessonId:string,userId:string,generationKey:string) => {
  const [rows]=await db.query<(RowDataPacket & SummaryRecord)[]>(
    `SELECT sm.* FROM summaries sm JOIN lessons l ON l.id=sm.lesson_id JOIN subjects s ON s.id=l.subject_id
     WHERE sm.lesson_id=? AND s.user_id=? AND sm.generation_key=? ORDER BY sm.created_at DESC LIMIT 1`,[lessonId,userId,generationKey]);return rows[0]??null;
};

export const insertSummary = async (record:SummaryRecord) => {
  await db.execute<ResultSetHeader>(`INSERT INTO summaries (id,lesson_id,title,summary_length,content,source_version,generation_key)
    VALUES (?,?,?,?,?,?,?)`,[record.id,record.lesson_id,record.title,record.summary_length,record.content,record.source_version,record.generation_key]);
};

export const listSummaries = async (userId:string,lessonId?:string) => {
  const values:string[]=[userId];const lessonFilter=lessonId?' AND sm.lesson_id=?':'';if(lessonId)values.push(lessonId);
  const [rows]=await db.query<(RowDataPacket & SummaryRecord & {lesson_title:string;subject_name:string})[]>(
    `SELECT sm.*,l.title lesson_title,s.name subject_name FROM summaries sm JOIN lessons l ON l.id=sm.lesson_id JOIN subjects s ON s.id=l.subject_id
     WHERE s.user_id=?${lessonFilter} ORDER BY sm.updated_at DESC`,values);return rows;
};
