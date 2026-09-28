import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import * as repository from '../repositories/flashcardRepository.js';
import { flashcardJsonSchema, flashcardOutputSchema, generateStructured } from './aiService.js';
import { getLessonSource } from './studyContentService.js';
import * as usage from './usageService.js';
import { ApiError } from '../utils/ApiError.js';
import { recordStudySession } from '../repositories/progressRepository.js';

export const generationInputSchema=z.object({lessonId:z.string().uuid(),count:z.number().int().min(5).max(50),difficulty:z.enum(['easy','medium','hard','mixed']),regenerate:z.boolean().default(false)});
export const reviewInputSchema=z.object({rating:z.enum(['again','hard','good','easy'])});
export const studySessionInputSchema=z.object({startedAt:z.string().datetime()});
const keyFor=(sourceVersion:string,options:unknown)=>createHash('sha256').update(JSON.stringify({sourceVersion,kind:'flashcards',options})).digest('hex');
export const nextDueDate=(rating:'again'|'hard'|'good'|'easy',now=new Date())=>new Date(now.getTime()+({again:10/60/24,hard:1,good:3,easy:7}[rating])*24*60*60*1000);

export const generateDeck=async(userId:string,input:z.infer<typeof generationInputSchema>)=>{const source=await getLessonSource(input.lessonId,userId);const generationKey=keyFor(source.sourceVersion,{count:input.count,difficulty:input.difficulty});if(!input.regenerate){const cached=await repository.findCachedDeck(input.lessonId,userId,generationKey);if(cached)return{...cached,cached:true};}await usage.assertQuota(userId,'flashcards');try{const result=await generateStructured({prompt:`Create exactly ${input.count} active-recall flashcards for the lesson "${source.title}". Difficulty: ${input.difficulty}. Each card must test one clear fact or concept explicitly supported by the lesson context. Keep fronts concise, backs complete but focused, and assign a specific topic. Avoid duplicates.\n\nLESSON CONTEXT:\n${source.context}`,jsonSchema:flashcardJsonSchema,validator:flashcardOutputSchema,maxOutputTokens:7000});const id=randomUUID();await repository.insertDeck({id,lessonId:input.lessonId,title:result.data.title,difficulty:input.difficulty,sourceVersion:source.sourceVersion,generationKey,cards:result.data.flashcards.slice(0,input.count)});await usage.logSuccess(userId,'flashcards',result);return{...(await repository.findCachedDeck(input.lessonId,userId,generationKey))!,cached:false};}catch(error){await usage.logFailure(userId,'flashcards',error instanceof ApiError?error.code:'AI_UNKNOWN').catch(()=>undefined);throw error;}};

export const reviewCard=async(userId:string,cardId:string,rating:z.infer<typeof reviewInputSchema>['rating'])=>{if(!(await repository.findOwnedCard(cardId,userId)))throw new ApiError(404,'Flashcard not found.','FLASHCARD_NOT_FOUND');return repository.insertReview({cardId,userId,rating,dueAt:nextDueDate(rating)});};
export const getDeck=async(userId:string,deckId:string)=>{const deck=await repository.getDeck(deckId,userId);if(!deck)throw new ApiError(404,'Flashcard deck not found.','DECK_NOT_FOUND');return deck;};
export const completeStudySession=async(userId:string,deckId:string,input:z.infer<typeof studySessionInputSchema>)=>{const detail=await getDeck(userId,deckId);const startedAt=new Date(input.startedAt);const endedAt=new Date();const durationSeconds=Math.max(0,Math.min(14_400,Math.round((endedAt.getTime()-startedAt.getTime())/1000)));await recordStudySession({userId,lessonId:detail.deck.lesson_id,activityType:'flashcards',startedAt,endedAt,durationSeconds});return{duration_seconds:durationSeconds,completed_at:endedAt};};
