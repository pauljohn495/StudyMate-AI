import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { ApiResponse, User } from '../types';
import { clearOfflineResponses } from '../lib/offlineStore';

type Credentials = { email: string; password: string };
type Registration = Credentials & { name: string; course?: string };
export type ProfileUpdate = { name:string; course?:string; yearLevel?:string; school?:string };
interface AuthValue { user: User | null; isDemo: boolean; login(input: Credentials): Promise<void>; register(input: Registration): Promise<void>; updateProfile(input:ProfileUpdate):Promise<void>; enterDemo(): void; logout(): void }

const AuthContext = createContext<AuthValue | null>(null);
const demoUser: User = { id:'demo-user', name:'Alex Morgan', email:'alex@demo.studymate', course:'BS Information Technology', yearLevel:'3rd Year' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('studymate_user') ?? 'null'));
  const persist = (nextUser: User, token: string) => { localStorage.setItem('studymate_user', JSON.stringify(nextUser)); localStorage.setItem('studymate_token', token); setUser(nextUser); };
  const value = useMemo<AuthValue>(() => ({
    user, isDemo: localStorage.getItem('studymate_token') === 'demo',
    async login(input) { const { data } = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', input); persist(data.data.user, data.data.token); },
    async register(input) { const { data } = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', input); persist(data.data.user, data.data.token); },
    async updateProfile(input) { const {data}=await api.patch<ApiResponse<User>>('/auth/me',input);const token=localStorage.getItem('studymate_token');if(!token||token==='demo')throw new Error('Profile editing is unavailable in demo mode.');persist(data.data,token); },
    enterDemo() { persist(demoUser, 'demo'); },
    logout() { if(user?.id)void clearOfflineResponses(user.id);localStorage.removeItem('studymate_user'); localStorage.removeItem('studymate_token'); setUser(null); }
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used within AuthProvider'); return value; };
