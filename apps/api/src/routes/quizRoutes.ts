import { Router } from 'express';
import * as controller from '../controllers/quizController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const quizRouter=Router();
quizRouter.use(requireAuth);
quizRouter.get('/',asyncHandler(controller.list));
quizRouter.get('/:id',asyncHandler(controller.get));
quizRouter.post('/:id/attempts',asyncHandler(controller.submit));
quizRouter.delete('/:id',asyncHandler(controller.remove));

export const quizAttemptRouter=Router();
quizAttemptRouter.use(requireAuth);
quizAttemptRouter.get('/:id',asyncHandler(controller.getAttempt));
