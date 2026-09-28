import { Router } from 'express';
import * as controller from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const aiRouter=Router();
aiRouter.use(requireAuth);
aiRouter.get('/status',asyncHandler(controller.status));
aiRouter.post('/detect-topics',asyncHandler(controller.detectTopics));
aiRouter.post('/generate-reviewer',asyncHandler(controller.generateReviewer));
aiRouter.post('/generate-summary',asyncHandler(controller.generateSummary));
aiRouter.post('/generate-flashcards',asyncHandler(controller.generateFlashcards));
aiRouter.post('/generate-quiz',asyncHandler(controller.generateQuiz));
