import type { RequestHandler } from 'express';
import * as generation from '../services/generationService.js';
import * as usage from '../services/usageService.js';
import * as flashcards from '../services/flashcardService.js';
import * as quizzes from '../services/quizService.js';

export const status:RequestHandler=async(request,response)=>response.json({success:true,data:await usage.statusFor(request.user!.id)});
export const detectTopics:RequestHandler=async(request,response)=>{const input=generation.topicInputSchema.parse(request.body);response.json({success:true,data:await generation.detectTopics(request.user!.id,input.lessonId,input.regenerate)});};
export const generateReviewer:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await generation.generateReviewer(request.user!.id,generation.reviewerInputSchema.parse(request.body))});
export const generateSummary:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await generation.generateSummary(request.user!.id,generation.summaryInputSchema.parse(request.body))});
export const listReviewers:RequestHandler=async(request,response)=>response.json({success:true,data:await generation.listReviewers(request.user!.id,typeof request.query.lessonId==='string'?request.query.lessonId:undefined)});
export const listSummaries:RequestHandler=async(request,response)=>response.json({success:true,data:await generation.listSummaries(request.user!.id,typeof request.query.lessonId==='string'?request.query.lessonId:undefined)});
export const lessonTopics:RequestHandler=async(request,response)=>response.json({success:true,data:await import('../repositories/aiRepository.js').then(repository=>repository.listTopics(String(request.params.id),request.user!.id))});
export const lessonReviewers:RequestHandler=async(request,response)=>response.json({success:true,data:await generation.listReviewers(request.user!.id,String(request.params.id))});
export const lessonSummaries:RequestHandler=async(request,response)=>response.json({success:true,data:await generation.listSummaries(request.user!.id,String(request.params.id))});
export const generateFlashcards:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await flashcards.generateDeck(request.user!.id,flashcards.generationInputSchema.parse(request.body))});
export const generateQuiz:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await quizzes.generateQuiz(request.user!.id,quizzes.quizGenerationInputSchema.parse(request.body))});
