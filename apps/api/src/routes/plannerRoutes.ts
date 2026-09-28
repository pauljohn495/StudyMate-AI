import { Router } from 'express';
import * as controller from '../controllers/plannerController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const plannerRouter=Router();
plannerRouter.use(requireAuth);
plannerRouter.get('/',asyncHandler(controller.list));
plannerRouter.post('/',asyncHandler(controller.create));
plannerRouter.get('/:id',asyncHandler(controller.get));
plannerRouter.post('/:id/regenerate',asyncHandler(controller.regenerate));
plannerRouter.patch('/:id/tasks/:taskId',asyncHandler(controller.updateTask));
plannerRouter.delete('/:id',asyncHandler(controller.remove));
