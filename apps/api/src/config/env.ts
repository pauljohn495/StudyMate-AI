import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const moduleDirectory=dirname(fileURLToPath(import.meta.url));
config({path:resolve(moduleDirectory,'../../../../.env')});
config({path:resolve(moduleDirectory,'../../.env'),override:true});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32).default('development-only-secret-change-before-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default('studymate'),
  DB_USER: z.string().default('studymate'),
  DB_PASSWORD: z.string().default('studymate_dev'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.7-flash'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-3.5-flash-lite'),
  AI_LIMIT_REVIEWER: z.coerce.number().default(3),
  AI_LIMIT_FLASHCARDS: z.coerce.number().default(3),
  AI_LIMIT_QUIZ: z.coerce.number().default(5),
  AI_LIMIT_EXAM: z.coerce.number().default(2),
  AI_LIMIT_TUTOR: z.coerce.number().default(20),
  AI_LIMIT_TOPICS: z.coerce.number().default(3),
  AI_LIMIT_SUMMARY: z.coerce.number().default(3),
  AI_MAX_CONTEXT_CHARS: z.coerce.number().int().positive().default(60_000),
  UPLOAD_LIMIT_DAILY: z.coerce.number().default(5),
  MAX_FILE_SIZE_MB: z.coerce.number().default(20),
  MAX_DOCUMENT_PAGES: z.coerce.number().int().positive().default(200),
  UPLOAD_DIR: z.string().default('uploads'),
  TOPIC_STRONG_MIN: z.coerce.number().min(0).max(100).default(80),
  TOPIC_GOOD_MIN: z.coerce.number().min(0).max(100).default(60),
  TOPIC_NEEDS_REVIEW_MIN: z.coerce.number().min(0).max(100).default(40)
}).superRefine((value,context)=>{if(!(value.TOPIC_STRONG_MIN>value.TOPIC_GOOD_MIN&&value.TOPIC_GOOD_MIN>value.TOPIC_NEEDS_REVIEW_MIN))context.addIssue({code:z.ZodIssueCode.custom,path:['TOPIC_STRONG_MIN'],message:'Topic thresholds must descend from strong to good to needs review.'});});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const limits = {
  reviewer: env.AI_LIMIT_REVIEWER,
  flashcards: env.AI_LIMIT_FLASHCARDS,
  quiz: env.AI_LIMIT_QUIZ,
  exam: env.AI_LIMIT_EXAM,
  tutor: env.AI_LIMIT_TUTOR,
  topics: env.AI_LIMIT_TOPICS,
  summary: env.AI_LIMIT_SUMMARY,
  uploads: env.UPLOAD_LIMIT_DAILY
} as const;

export const topicThresholds = {
  strong: env.TOPIC_STRONG_MIN,
  good: env.TOPIC_GOOD_MIN,
  needsReview: env.TOPIC_NEEDS_REVIEW_MIN
} as const;
