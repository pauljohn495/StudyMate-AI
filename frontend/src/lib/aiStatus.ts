import type { AiStatus, ApiResponse } from '../types';
import { api } from './api';

export const fetchAiStatus=async()=>{
  const {data}=await api.get<ApiResponse<AiStatus>>('/ai/status');
  return data.data;
};
