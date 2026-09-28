import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import * as lessons from '../repositories/lessonRepository.js';
import * as subjects from '../repositories/subjectRepository.js';
import { ApiError } from '../utils/ApiError.js';

export const list: RequestHandler = async (request, response) => {
  const subjectId = String(request.params.subjectId);
  if (!(await subjects.findSubject(subjectId, request.user!.id))) throw new ApiError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
  response.json({ success: true, data: await lessons.listLessons(subjectId, request.user!.id) });
};
export const get: RequestHandler = async (request, response) => {
  const lesson = await lessons.findLesson(String(request.params.id), request.user!.id);
  if (!lesson) throw new ApiError(404, 'Lesson not found.', 'LESSON_NOT_FOUND');
  response.json({ success: true, data: lesson });
};
export const create: RequestHandler = async (request, response) => {
  const subjectId = String(request.params.subjectId);
  if (!(await subjects.findSubject(subjectId, request.user!.id))) throw new ApiError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
  const id = randomUUID();
  await lessons.insertLesson({ id, subject_id: subjectId, title: request.body.title, description: request.body.description || null });
  response.status(201).json({ success: true, data: await lessons.findLesson(id, request.user!.id) });
};
export const update: RequestHandler = async (request, response) => {
  const id = String(request.params.id);
  if (!(await lessons.findLesson(id, request.user!.id))) throw new ApiError(404, 'Lesson not found.', 'LESSON_NOT_FOUND');
  await lessons.updateLesson(id, request.user!.id, request.body);
  response.json({ success: true, data: await lessons.findLesson(id, request.user!.id) });
};
export const remove: RequestHandler = async (request, response) => {
  if (!(await lessons.deleteLesson(String(request.params.id), request.user!.id))) throw new ApiError(404, 'Lesson not found.', 'LESSON_NOT_FOUND');
  response.status(204).send();
};
