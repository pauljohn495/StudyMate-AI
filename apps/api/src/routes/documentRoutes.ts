import { Router } from 'express';
import * as controller from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const documentRouter = Router();
documentRouter.use(requireAuth);
documentRouter.get('/', asyncHandler(controller.listAll));
documentRouter.get('/:id', asyncHandler(controller.get));
documentRouter.get('/:id/content', asyncHandler(controller.content));
documentRouter.get('/:id/download', asyncHandler(controller.download));
documentRouter.delete('/:id', asyncHandler(controller.remove));
