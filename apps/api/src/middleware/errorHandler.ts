import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import multer from 'multer';

export const notFound: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, `Route ${request.method} ${request.path} was not found.`, 'ROUTE_NOT_FOUND'));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    response.status(tooLarge ? 413 : 422).json({ success: false, message: tooLarge ? 'The selected file exceeds the upload size limit.' : 'The upload could not be accepted.', code: tooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR' });
    return;
  }
  if (error instanceof ZodError) {
    response.status(422).json({ success: false, message: 'Please check the submitted fields.', code: 'VALIDATION_ERROR', details: error.flatten() });
    return;
  }
  if (error instanceof ApiError) {
    response.status(error.status).json({ success: false, message: error.message, code: error.code, details: error.details });
    return;
  }
  const isProduction = process.env.NODE_ENV === 'production';
  console.error(error);
  response.status(500).json({ success: false, message: 'Something went wrong on our side.', code: 'INTERNAL_ERROR', ...(!isProduction && { details: error instanceof Error ? error.message : String(error) }) });
};
