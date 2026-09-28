import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { createUser, findUserByEmail, findUserById, updateUserProfile } from '../repositories/userRepository.js';
import { ApiError } from '../utils/ApiError.js';

const publicUser = (user: NonNullable<Awaited<ReturnType<typeof findUserById>>>) => ({
  id: user.id, name: user.name, email: user.email, course: user.course, yearLevel: user.year_level,
  school: user.school, profileImageUrl: user.profile_image_url, createdAt: user.created_at
});

const tokenFor = (user: { id: string; email: string }) =>
  jwt.sign({ email: user.email }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

export const register = async (input: { name: string; email: string; password: string; course?: string; yearLevel?: string; school?: string }) => {
  if (await findUserByEmail(input.email)) throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_IN_USE');
  const id = randomUUID();
  await createUser({ id, name: input.name, email: input.email, password_hash: await bcrypt.hash(input.password, 12), course: input.course ?? null, year_level: input.yearLevel ?? null, school: input.school ?? null });
  const user = await findUserById(id);
  if (!user) throw new ApiError(500, 'Account could not be created.', 'CREATE_FAILED');
  return { user: publicUser(user), token: tokenFor(user) };
};

export const login = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new ApiError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  return { user: publicUser(user), token: tokenFor(user) };
};

export const currentUser = async (id: string) => {
  const user = await findUserById(id);
  if (!user) throw new ApiError(404, 'Account not found.', 'USER_NOT_FOUND');
  return publicUser(user);
};

export const updateProfile=async(id:string,input:{name:string;course?:string;yearLevel?:string;school?:string})=>{if(!await findUserById(id))throw new ApiError(404,'Account not found.','USER_NOT_FOUND');await updateUserProfile(id,{name:input.name,course:input.course||null,yearLevel:input.yearLevel||null,school:input.school||null});return currentUser(id);};
