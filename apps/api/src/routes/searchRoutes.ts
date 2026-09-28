import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const searchRouter=Router();searchRouter.use(requireAuth);searchRouter.get('/',asyncHandler(search));
