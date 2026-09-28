import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny): RequestHandler => (request, _response, next) => {
  const parsed = schema.parse({ body: request.body, params: request.params, query: request.query });
  request.body = parsed.body;
  request.params = parsed.params;
  next();
};
