import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import * as repository from '../repositories/aiRepository.js';
import { findLesson } from '../repositories/lessonRepository.js';
import type { LessonSource } from '../types/ai.js';
import { ApiError } from '../utils/ApiError.js';

export const getLessonSource = async (lessonId:string,userId:string):Promise<LessonSource> => {
  const lesson=await findLesson(lessonId,userId);if(!lesson)throw new ApiError(404,'Lesson not found.','LESSON_NOT_FOUND');
  const chunks=await repository.getLessonSourceChunks(lessonId,userId);if(!chunks.length)throw new ApiError(409,'Upload and process lesson material before using AI study tools.','LESSON_CONTENT_REQUIRED');
  const version=createHash('sha256').update(chunks.map(chunk=>`${chunk.id}:${chunk.content}`).join('|')).digest('hex');
  const totalChars=chunks.reduce((sum,chunk)=>sum+chunk.content.length,0);let selected=chunks;
  if(totalChars>env.AI_MAX_CONTEXT_CHARS){const average=Math.max(1,totalChars/chunks.length);const count=Math.max(1,Math.floor(env.AI_MAX_CONTEXT_CHARS/average));const indices=new Set(Array.from({length:count},(_,index)=>Math.floor(index*(chunks.length-1)/Math.max(1,count-1))));selected=chunks.filter((_,index)=>indices.has(index));}
  let remaining=env.AI_MAX_CONTEXT_CHARS;
  const context=selected.map((chunk,index)=>{const header=`[SOURCE ${index+1} | ${chunk.document_name}${chunk.page_number?` | page/slide ${chunk.page_number}`:''}${chunk.heading?` | ${chunk.heading}`:''}]`;const allowed=Math.max(0,remaining-header.length-2);const content=chunk.content.slice(0,allowed);remaining-=header.length+content.length+2;return `${header}\n${content}`;}).filter(block=>block.length>20).join('\n\n');
  return {lessonId,title:lesson.title,sourceVersion:version,context,chunkCount:chunks.length,selectedChunkCount:selected.length,truncated:totalChars>env.AI_MAX_CONTEXT_CHARS};
};

export const paragraphMap = (context:string) => {
  const paragraphs=context.split(/\n{2,}/).map(value=>value.replace(/^\[SOURCE[^\]]+\]\n?/,'').trim()).filter(value=>value.length>20);
  return paragraphs.map((text,index)=>({id:`P${String(index+1).padStart(4,'0')}`,text}));
};
