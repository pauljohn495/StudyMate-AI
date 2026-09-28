import type { ResultSetHeader, RowDataPacket } from '../config/database.js';
import { db } from '../config/database.js';
import type { SubjectRow } from '../types/domain.js';

export const listSubjects = async (userId: string) => {
  const [rows] = await db.query<(SubjectRow & RowDataPacket)[]>(
    `SELECT s.*, COUNT(l.id) AS lesson_count FROM subjects s LEFT JOIN lessons l ON l.subject_id = s.id
     WHERE s.user_id = ? AND s.archived_at IS NULL GROUP BY s.id ORDER BY s.updated_at DESC`, [userId]
  );
  return rows.map(row=>({...row,lesson_count:Number(row.lesson_count??0)}));
};

export const findSubject = async (id: string, userId: string) => {
  const [rows] = await db.query<(SubjectRow & RowDataPacket)[]>(
    `SELECT s.*, COUNT(l.id) AS lesson_count FROM subjects s LEFT JOIN lessons l ON l.subject_id = s.id
     WHERE s.id = ? AND s.user_id = ? GROUP BY s.id LIMIT 1`, [id, userId]
  );
  return rows[0]?{...rows[0],lesson_count:Number(rows[0].lesson_count??0)}:null;
};

export const insertSubject = async (subject: Pick<SubjectRow, 'id'|'user_id'|'name'|'description'|'icon'|'color'>) => {
  await db.execute<ResultSetHeader>('INSERT INTO subjects (id, user_id, name, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
    [subject.id, subject.user_id, subject.name, subject.description, subject.icon, subject.color]);
};

export const updateSubject = async (id: string, userId: string, fields: Record<string, unknown>) => {
  const columnMap: Record<string, string> = { name: 'name', description: 'description', icon: 'icon', color: 'color', archived: 'archived_at' };
  const entries = Object.entries(fields).filter(([key, value]) => key in columnMap && value !== undefined);
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${columnMap[key]} = ?`).join(', ');
  const values: Array<string | Date | null> = entries.map(([key, value]) => key === 'archived' ? (value ? new Date() : null) : String(value ?? ''));
  await db.execute<ResultSetHeader>(`UPDATE subjects SET ${assignments} WHERE id = ? AND user_id = ?`, [...values, id, userId]);
};

export const deleteSubject = async (id: string, userId: string) => {
  const [result] = await db.execute<ResultSetHeader>('DELETE FROM subjects WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
};
