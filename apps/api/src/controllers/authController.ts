import type { RequestHandler } from 'express';
import * as authService from '../services/authService.js';

export const register: RequestHandler = async (request, response) => response.status(201).json({ success: true, data: await authService.register(request.body) });
export const login: RequestHandler = async (request, response) => response.json({ success: true, data: await authService.login(request.body.email, request.body.password) });
export const me: RequestHandler = async (request, response) => response.json({ success: true, data: await authService.currentUser(request.user!.id) });
export const updateMe:RequestHandler=async(request,response)=>response.json({success:true,data:await authService.updateProfile(request.user!.id,request.body)});
