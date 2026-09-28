import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import * as repository from '../repositories/aiRepository.js';
import type { ReviewerDifficulty, ReviewerType, SummaryLength } from '../types/ai.js';
import { ApiError } from '../utils/ApiError.js';
import { generateStructured, reviewerJsonSchema, reviewerOutputSchema, selectionJsonSchema, selectionOutputSchema, summaryJsonSchema, summaryOutputSchema, topicJsonSchema, topicOutputSchema, type ReviewerOutput } from './aiService.js';
import { getLessonSource, paragraphMap } from './studyContentService.js';
import * as usage from './usageService.js';

const keyFor=(sourceVersion:string,kind:string,options:unknown)=>createHash('sha256').update(JSON.stringify({sourceVersion,kind,options})).digest('hex');
const parseContent=<T>(value:string)=>JSON.parse(value) as T;
const publicReviewer=(row:repository.ReviewerRecord,cached=false)=>({...row,original_wording:Boolean(row.original_wording),content:parseContent<ReviewerOutput>(row.content),cached});
const publicSummary=(row:repository.SummaryRecord,cached=false)=>({...row,content:parseContent(row.content),cached});

async function withUsage<T>(userId:string,feature:'reviewer'|'summary'|'topics',action:()=>Promise<{data:T;inputTokens:number|null;outputTokens:number|null;model:string}>) {
  await usage.assertQuota(userId,feature);
  try { const result=await action();await usage.logSuccess(userId,feature,result);return result.data; }
  catch(error){const code=error instanceof ApiError?error.code:'AI_UNKNOWN';await usage.logFailure(userId,feature,code).catch(()=>undefined);throw error;}
}

export const detectTopics=async(userId:string,lessonId:string,regenerate=false)=>{
  const existing=await repository.listTopics(lessonId,userId);if(existing.length&&!regenerate)return {topics:existing,cached:true};
  const source=await getLessonSource(lessonId,userId);
  const data=await withUsage(userId,'topics',async()=>{const result=await generateStructured({prompt:`Identify the major study topics explicitly covered in the lesson "${source.title}". Use concise, distinct topic names.\n\nLESSON CONTEXT:\n${source.context}`,jsonSchema:topicJsonSchema,validator:topicOutputSchema,maxOutputTokens:1200});return {...result,data:result.data};});
  const names=[...new Set(data.topics.map(topic=>topic.name.trim()).filter(Boolean))];await repository.replaceTopics(lessonId,names);
  return {topics:await repository.listTopics(lessonId,userId),cached:false,source:{chunks:source.selectedChunkCount,truncated:source.truncated}};
};

export const generateReviewer=async(userId:string,input:{lessonId:string;reviewerType:ReviewerType;difficulty:ReviewerDifficulty;originalWording:boolean;regenerate:boolean})=>{
  const source=await getLessonSource(input.lessonId,userId);const options={reviewerType:input.reviewerType,difficulty:input.difficulty,originalWording:input.originalWording};const generationKey=keyFor(source.sourceVersion,'reviewer',options);
  if(!input.regenerate){const cached=await repository.findCachedReviewer(input.lessonId,userId,generationKey);if(cached)return publicReviewer(cached,cached!==null);}
  const content=await withUsage(userId,'reviewer',async()=>{
    if(input.originalWording){const paragraphs=paragraphMap(source.context);const result=await generateStructured({prompt:`Select the paragraph IDs containing the most important information for a ${input.reviewerType.replace('_',' ')} reviewer at ${input.difficulty} depth. Group the IDs by topic. Do not rewrite or paraphrase any paragraph.\n\nPARAGRAPHS:\n${paragraphs.map(item=>`[${item.id}] ${item.text}`).join('\n\n')}`,jsonSchema:selectionJsonSchema,validator:selectionOutputSchema,maxOutputTokens:4096});const byId=new Map(paragraphs.map(item=>[item.id,item.text]));const assembled:ReviewerOutput={title:result.data.title,sections:result.data.groups.map(group=>({heading:group.heading,bullets:group.paragraphIds.map(id=>byId.get(id)).filter((value):value is string=>Boolean(value))})).filter(section=>section.bullets.length),keyTakeaways:[]};if(!assembled.sections.length)throw new ApiError(502,'Gemini did not select valid source paragraphs.','AI_INVALID_SELECTION');return {...result,data:assembled};}
    const result=await generateStructured({prompt:`Create a ${input.reviewerType.replace('_',' ')} reviewer for the lesson "${source.title}". Difficulty/depth: ${input.difficulty}. Organize high-value facts into clear topic sections. Every statement must be supported by the lesson context.\n\nLESSON CONTEXT:\n${source.context}`,jsonSchema:reviewerJsonSchema,validator:reviewerOutputSchema,maxOutputTokens:5000});return {...result,data:result.data};
  });
  const record:repository.ReviewerRecord={id:randomUUID(),lesson_id:input.lessonId,title:content.title,reviewer_type:input.reviewerType,difficulty:input.difficulty,original_wording:input.originalWording,content:JSON.stringify(content),source_version:source.sourceVersion,generation_key:generationKey,created_at:new Date(),updated_at:new Date()};await repository.insertReviewer(record);return publicReviewer(record,false);
};

export const generateSummary=async(userId:string,input:{lessonId:string;length:SummaryLength;regenerate:boolean})=>{
  const source=await getLessonSource(input.lessonId,userId);const generationKey=keyFor(source.sourceVersion,'summary',{length:input.length});if(!input.regenerate){const cached=await repository.findCachedSummary(input.lessonId,userId,generationKey);if(cached)return publicSummary(cached,true);}
  const content=await withUsage(userId,'summary',async()=>{const result=await generateStructured({prompt:`Create a ${input.length} summary of the lesson "${source.title}". Use only the provided lesson information. The overview should establish the central idea; sections should cover the main concepts; takeaways should be useful for review.\n\nLESSON CONTEXT:\n${source.context}`,jsonSchema:summaryJsonSchema,validator:summaryOutputSchema,maxOutputTokens:input.length==='short'?1800:input.length==='medium'?3200:5000});return {...result,data:result.data};});
  const record:repository.SummaryRecord={id:randomUUID(),lesson_id:input.lessonId,title:content.title,summary_length:input.length,content:JSON.stringify(content),source_version:source.sourceVersion,generation_key:generationKey,created_at:new Date(),updated_at:new Date()};await repository.insertSummary(record);return publicSummary(record,false);
};

export const listReviewers=async(userId:string,lessonId?:string)=>(await repository.listReviewers(userId,lessonId)).map(row=>publicReviewer(row));
export const listSummaries=async(userId:string,lessonId?:string)=>(await repository.listSummaries(userId,lessonId)).map(row=>publicSummary(row));

export const reviewerInputSchema=z.object({lessonId:z.string().uuid(),reviewerType:z.enum(['quick','detailed','qa','key_concepts','definitions']),difficulty:z.enum(['simple','standard','detailed']),originalWording:z.boolean().default(false),regenerate:z.boolean().default(false)});
export const summaryInputSchema=z.object({lessonId:z.string().uuid(),length:z.enum(['short','medium','detailed']),regenerate:z.boolean().default(false)});
export const topicInputSchema=z.object({lessonId:z.string().uuid(),regenerate:z.boolean().default(false)});
