import type { RequestHandler } from 'express';
import * as repository from '../repositories/quizRepository.js';
import * as service from '../services/quizService.js';
import { ApiError } from '../utils/ApiError.js';

export const list:RequestHandler=async(request,response)=>response.json({success:true,data:await repository.listQuizzes(request.user!.id,typeof request.query.lessonId==='string'?request.query.lessonId:undefined)});
export const listForLesson:RequestHandler=async(request,response)=>response.json({success:true,data:await repository.listQuizzes(request.user!.id,String(request.params.id))});
export const get:RequestHandler=async(request,response)=>response.json({success:true,data:await service.getQuiz(request.user!.id,String(request.params.id))});
export const submit:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await service.submitQuiz(request.user!.id,String(request.params.id),service.quizSubmissionSchema.parse(request.body))});
export const getAttempt:RequestHandler=async(request,response)=>response.json({success:true,data:await service.getAttempt(request.user!.id,String(request.params.id))});
export const remove:RequestHandler=async(request,response)=>{if(!(await repository.deleteQuiz(String(request.params.id),request.user!.id)))throw new ApiError(404,'Quiz not found.','QUIZ_NOT_FOUND');response.status(204).send();};
