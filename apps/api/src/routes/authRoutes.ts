import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, profileUpdateSchema, registerSchema } from '../validation/schemas.js';

export const authRouter = Router();
authRouter.post('/register', validate(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', validate(loginSchema), asyncHandler(controller.login));
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
authRouter.patch('/me',requireAuth,validate(profileUpdateSchema),asyncHandler(controller.updateMe));
