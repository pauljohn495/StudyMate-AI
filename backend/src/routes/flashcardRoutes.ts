import { Router } from 'express';
import * as controller from '../controllers/flashcardController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const flashcardDeckRouter=Router();
flashcardDeckRouter.use(requireAuth);
flashcardDeckRouter.get('/',asyncHandler(controller.list));
flashcardDeckRouter.get('/:id',asyncHandler(controller.get));
flashcardDeckRouter.post('/:id/study-sessions',asyncHandler(controller.completeSession));
flashcardDeckRouter.delete('/:id',asyncHandler(controller.remove));

export const flashcardRouter=Router();
flashcardRouter.use(requireAuth);
flashcardRouter.post('/:id/review',asyncHandler(controller.review));
