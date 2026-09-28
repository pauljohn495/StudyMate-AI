import type { RequestHandler } from 'express';
import * as repository from '../repositories/tutorRepository.js';
import * as service from '../services/tutorService.js';
export const lessons:RequestHandler=async(request,response)=>response.json({success:true,data:await repository.listAvailableLessons(request.user!.id)});
export const conversations:RequestHandler=async(request,response)=>response.json({success:true,data:await repository.listConversations(request.user!.id)});
export const conversation:RequestHandler=async(request,response)=>response.json({success:true,data:await service.getConversation(request.user!.id,String(request.params.id))});
export const message:RequestHandler=async(request,response)=>response.status(201).json({success:true,data:await service.ask(request.user!.id,service.messageInputSchema.parse(request.body))});
