import type { RequestHandler } from 'express';
import * as repository from '../repositories/flashcardRepository.js';
import * as service from '../services/flashcardService.js';
import { ApiError } from '../utils/ApiError.js';

export const generate:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await service.generateDeck(request.user!.id,service.generationInputSchema.parse(request.body))});
export const list:RequestHandler=async(request,response)=>response.json({success:true,data:await repository.listDecks(request.user!.id,typeof request.query.lessonId==='string'?request.query.lessonId:undefined)});
export const listForLesson:RequestHandler=async(request,response)=>response.json({success:true,data:await repository.listDecks(request.user!.id,String(request.params.id))});
export const get:RequestHandler=async(request,response)=>response.json({success:true,data:await service.getDeck(request.user!.id,String(request.params.id))});
export const review:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await service.reviewCard(request.user!.id,String(request.params.id),service.reviewInputSchema.parse(request.body).rating)});
export const completeSession:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await service.completeStudySession(request.user!.id,String(request.params.id),service.studySessionInputSchema.parse(request.body))});
export const remove:RequestHandler=async(request,response)=>{if(!(await repository.deleteDeck(String(request.params.id),request.user!.id)))throw new ApiError(404,'Flashcard deck not found.','DECK_NOT_FOUND');response.status(204).send();};
