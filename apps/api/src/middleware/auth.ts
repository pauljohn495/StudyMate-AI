import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

type TokenPayload = { sub: string; email: string };

export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new ApiError(401, 'Please sign in to continue.', 'UNAUTHORIZED'));
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as TokenPayload;
    request.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'Your session has expired. Please sign in again.', 'INVALID_TOKEN'));
  }
};
