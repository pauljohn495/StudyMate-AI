import { env, limits } from '../config/env.js';
import * as repository from '../repositories/aiRepository.js';
import type { AiFeature, AiUsageResult } from '../types/ai.js';
import { ApiError } from '../utils/ApiError.js';

const featureLimit = (feature: AiFeature) => feature === 'reviewer' ? limits.reviewer : feature === 'summary' ? limits.summary : feature === 'flashcards' ? limits.flashcards : feature === 'quiz' ? limits.quiz : feature === 'exam' ? limits.exam : feature === 'tutor' ? limits.tutor : limits.topics;

export const assertQuota = async (userId: string, feature: AiFeature) => {
  const used = await repository.usageCountToday(userId, feature); const limit = featureLimit(feature);
  if (used >= limit) throw new ApiError(429, `Daily ${feature} generation limit reached (${limit}). Try again tomorrow.`, 'AI_DAILY_LIMIT', { feature, used, limit });
  return { used, limit, remaining: limit - used };
};

export const logSuccess = (userId:string,feature:AiFeature,usage:AiUsageResult) => repository.recordUsage({userId,feature,...usage,successful:true});
export const logFailure = (userId:string,feature:AiFeature,errorCode:string) => repository.recordUsage({userId,feature,inputTokens:null,outputTokens:null,model:env.GEMINI_MODEL,successful:false,errorCode});

export const statusFor = async (userId:string) => {
  const features:AiFeature[]=['reviewer','summary','topics','flashcards','quiz','exam','tutor'];
  const usage=await Promise.all(features.map(async feature=>{const used=await repository.usageCountToday(userId,feature);const limit=featureLimit(feature);return [feature,{used,limit,remaining:Math.max(0,limit-used)}] as const;}));
  return {configured:Boolean(env.GEMINI_API_KEY),model:env.GEMINI_MODEL,usage:Object.fromEntries(usage)};
};
