import type { RequestHandler } from 'express';
import { getOverview, offsetSchema } from '../services/progressService.js';

export const overview:RequestHandler=async(request,response)=>response.json({success:true,data:await getOverview(request.user!.id,offsetSchema.parse(request.query.offsetMinutes))});
