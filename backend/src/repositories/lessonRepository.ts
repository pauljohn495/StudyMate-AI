import type { ResultSetHeader, RowDataPacket } from '../config/database.js';
import { db } from '../config/database.js';
import type { LessonRow } from '../types/domain.js';

export const listLessons = async (subjectId: string, userId: string) => {
  const [rows] = await db.query<(LessonRow & RowDataPacket)[]>(
    `SELECT l.* FROM lessons l JOIN subjects s ON s.id = l.subject_id WHERE l.subject_id = ? AND s.user_id = ? ORDER BY l.created_at`, [subjectId, userId]
  );
  return rows;
};

export const findLesson = async (id: string, userId: string) => {
  const [rows] = await db.query<(LessonRow & RowDataPacket)[]>(
    `SELECT l.* FROM lessons l JOIN subjects s ON s.id = l.subject_id WHERE l.id = ? AND s.user_id = ? LIMIT 1`, [id, userId]
  );
  return rows[0] ?? null;
};

export const insertLesson = async (lesson: Pick<LessonRow, 'id'|'subject_id'|'title'|'description'>) => {
  await db.execute<ResultSetHeader>('INSERT INTO lessons (id, subject_id, title, description) VALUES (?, ?, ?, ?)', Object.values(lesson));
};

export const updateLesson = async (id: string, userId: string, fields: { title?: string; description?: string }) => {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
  await db.execute<ResultSetHeader>(`UPDATE lessons SET ${assignments} WHERE id=? AND EXISTS (SELECT 1 FROM subjects s WHERE s.id=lessons.subject_id AND s.user_id=?)`,[...entries.map(([,value])=>value),id,userId]);
};

export const deleteLesson = async (id: string, userId: string) => {
  const [result] = await db.execute<ResultSetHeader>('DELETE FROM lessons WHERE id=? AND EXISTS (SELECT 1 FROM subjects s WHERE s.id=lessons.subject_id AND s.user_id=?)',[id,userId]);
  return result.affectedRows > 0;
};
