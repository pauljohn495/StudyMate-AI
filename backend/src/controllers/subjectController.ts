import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import * as subjects from '../repositories/subjectRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const list: RequestHandler = async (request, response) => response.json({ success: true, data: await subjects.listSubjects(request.user!.id) });
export const get: RequestHandler = async (request, response) => {
  const id = String(request.params.id);
  const subject = await subjects.findSubject(id, request.user!.id);
  if (!subject) throw new ApiError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
  response.json({ success: true, data: subject });
};
export const create: RequestHandler = async (request, response) => {
  const id = randomUUID();
  await subjects.insertSubject({ id, user_id: request.user!.id, name: request.body.name, description: request.body.description || null, icon: request.body.icon, color: request.body.color });
  response.status(201).json({ success: true, data: await subjects.findSubject(id, request.user!.id) });
};
export const update: RequestHandler = async (request, response) => {
  const id = String(request.params.id);
  if (!(await subjects.findSubject(id, request.user!.id))) throw new ApiError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
  await subjects.updateSubject(id, request.user!.id, request.body);
  response.json({ success: true, data: await subjects.findSubject(id, request.user!.id) });
};
export const remove: RequestHandler = async (request, response) => {
  if (!(await subjects.deleteSubject(String(request.params.id), request.user!.id))) throw new ApiError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
  response.status(204).send();
};
