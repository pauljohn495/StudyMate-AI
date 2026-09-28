import { z } from 'zod';

const name = z.string().trim().min(2).max(120);
const optionalText = z.string().trim().max(2000).optional().default('');
const idParams = z.object({ id: z.string().uuid() });

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(190).transform((v) => v.toLowerCase()),
    password: z.string().min(8).max(72), course: z.string().trim().max(120).optional(), yearLevel: z.string().trim().max(40).optional(), school: z.string().trim().max(160).optional()
  }), params: z.object({}), query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({ email: z.string().trim().email().transform((v) => v.toLowerCase()), password: z.string().min(1).max(72) }),
  params: z.object({}), query: z.object({})
});

export const profileUpdateSchema=z.object({body:z.object({name:z.string().trim().min(2).max(100),course:z.string().trim().max(120).optional(),yearLevel:z.string().trim().max(40).optional(),school:z.string().trim().max(160).optional()}),params:z.object({}),query:z.object({})});

export const subjectCreateSchema = z.object({
  body: z.object({ name, description: optionalText, icon: z.string().trim().max(40).default('book-open'), color: z.enum(['indigo','violet','sky','emerald','amber','rose']).default('indigo') }),
  params: z.object({}), query: z.object({})
});

export const subjectUpdateSchema = z.object({
  body: z.object({ name: name.optional(), description: z.string().trim().max(2000).optional(), icon: z.string().trim().max(40).optional(), color: z.enum(['indigo','violet','sky','emerald','amber','rose']).optional(), archived: z.boolean().optional() }),
  params: idParams, query: z.object({})
});

export const subjectIdSchema = z.object({ body: z.object({}).default({}), params: idParams, query: z.object({}) });

export const lessonCreateSchema = z.object({
  body: z.object({ title: z.string().trim().min(2).max(180), description: optionalText }),
  params: z.object({ subjectId: z.string().uuid() }), query: z.object({})
});

export const lessonUpdateSchema = z.object({
  body: z.object({ title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().max(2000).optional() }),
  params: idParams, query: z.object({})
});
