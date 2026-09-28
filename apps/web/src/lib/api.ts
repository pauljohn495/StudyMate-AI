import axios, { AxiosHeaders, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { currentOfflineUserId, isCacheableApiGet, readOfflineResponse, saveOfflineResponse } from './offlineStore';

const offlineUrl=(config:AxiosRequestConfig)=>`${config.url??''}${config.params?`?${new URLSearchParams(Object.entries(config.params).map(([key,value])=>[key,String(value)])).toString()}`:''}`;

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api', timeout: 15_000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studymate_token');
  if (token && token !== 'demo') config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => {const userId=currentOfflineUserId();const url=offlineUrl(response.config);if(userId&&response.config.method?.toLowerCase()==='get'&&isCacheableApiGet(url))void saveOfflineResponse(userId,url,response.data);return response;}, async (error) => {
  if (error.response?.status === 401 && localStorage.getItem('studymate_token') !== 'demo') {
    localStorage.removeItem('studymate_token');
    localStorage.removeItem('studymate_user');
  }
  const config=error.config as AxiosRequestConfig|undefined;const userId=currentOfflineUserId();if(!error.response&&config?.method?.toLowerCase()==='get'&&userId){const url=offlineUrl(config);if(isCacheableApiGet(url)){const cached=await readOfflineResponse(userId,url);if(cached!==undefined)return{data:cached,status:200,statusText:'OK (offline cache)',headers:new AxiosHeaders({'x-studymate-offline':'true'}),config,request:error.request} as AxiosResponse;}}
  return Promise.reject(error);
});

export const apiMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? 'Unable to reach StudyMate. Please try again.';
  return error instanceof Error ? error.message : 'Something went wrong.';
};
