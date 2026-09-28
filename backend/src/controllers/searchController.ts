import type { RequestHandler } from 'express';
import { z } from 'zod';
import { searchWorkspace } from '../repositories/searchRepository.js';

const querySchema=z.string().trim().min(2).max(100);
export const search:RequestHandler=async(req,res)=>res.json({success:true,data:await searchWorkspace(req.user!.id,querySchema.parse(req.query.q))});
