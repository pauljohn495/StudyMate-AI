import { Router } from 'express';
import { overview } from '../controllers/progressController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const progressRouter=Router();
progressRouter.use(requireAuth);
progressRouter.get('/',asyncHandler(overview));
