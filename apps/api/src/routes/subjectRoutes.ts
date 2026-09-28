import { Router } from 'express';
import * as controller from '../controllers/subjectController.js';
import * as lessonController from '../controllers/lessonController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { lessonCreateSchema, subjectCreateSchema, subjectIdSchema, subjectUpdateSchema } from '../validation/schemas.js';

export const subjectRouter = Router();
subjectRouter.use(requireAuth);
subjectRouter.get('/', asyncHandler(controller.list));
subjectRouter.post('/', validate(subjectCreateSchema), asyncHandler(controller.create));
subjectRouter.get('/:id', validate(subjectIdSchema), asyncHandler(controller.get));
subjectRouter.patch('/:id', validate(subjectUpdateSchema), asyncHandler(controller.update));
subjectRouter.delete('/:id', validate(subjectIdSchema), asyncHandler(controller.remove));
subjectRouter.get('/:subjectId/lessons', asyncHandler(lessonController.list));
subjectRouter.post('/:subjectId/lessons', validate(lessonCreateSchema), asyncHandler(lessonController.create));
