import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../config/database.js';
import type { UserRow } from '../types/domain.js';

export const findUserByEmail = async (email: string) => {
  const [rows] = await db.query<(UserRow & RowDataPacket)[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ?? null;
};

export const findUserById = async (id: string) => {
  const [rows] = await db.query<(UserRow & RowDataPacket)[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
};

export const createUser = async (user: Omit<UserRow, 'profile_image_url' | 'created_at'>) => {
  await db.execute<ResultSetHeader>(
    'INSERT INTO users (id, name, email, password_hash, course, year_level, school) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.id, user.name, user.email, user.password_hash, user.course, user.year_level, user.school]
  );
};

export const updateUserProfile=async(id:string,input:{name:string;course:string|null;yearLevel:string|null;school:string|null})=>{await db.execute<ResultSetHeader>('UPDATE users SET name=?,course=?,year_level=?,school=? WHERE id=?',[input.name,input.course,input.yearLevel,input.school,id]);};
