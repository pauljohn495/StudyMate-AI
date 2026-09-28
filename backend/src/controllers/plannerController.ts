import type { RequestHandler } from 'express';
import * as service from '../services/plannerService.js';

export const list:RequestHandler=async(req,res)=>res.json({success:true,data:await service.listPlans(req.user!.id)});
export const get:RequestHandler=async(req,res)=>res.json({success:true,data:await service.getPlan(req.user!.id,String(req.params.id))});
export const create:RequestHandler=async(req,res)=>res.status(201).json({success:true,data:await service.createPlan(req.user!.id,service.createPlanSchema.parse(req.body))});
export const regenerate:RequestHandler=async(req,res)=>res.json({success:true,data:await service.regenerate(req.user!.id,String(req.params.id))});
export const updateTask:RequestHandler=async(req,res)=>{const input=service.taskUpdateSchema.parse(req.body);res.json({success:true,data:await service.completeTask(req.user!.id,String(req.params.id),String(req.params.taskId),input.completed)});};
export const remove:RequestHandler=async(req,res)=>{await service.removePlan(req.user!.id,String(req.params.id));res.status(204).send();};
