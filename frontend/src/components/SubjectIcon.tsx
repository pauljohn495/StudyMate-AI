import { BookOpen, Code2, FlaskConical, Globe2, Landmark, Palette, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { SubjectColor } from '../types';

const icons: Record<string,LucideIcon> = { shield:ShieldCheck, code:Code2, scale:Scale, sparkles:Sparkles, science:FlaskConical, globe:Globe2, art:Palette, history:Landmark, 'book-open':BookOpen };
const colors: Record<SubjectColor,string> = { indigo:'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300', violet:'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300', sky:'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300', emerald:'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300', amber:'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300', rose:'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' };
export function SubjectIcon({icon,color,className}:{icon:string;color:SubjectColor;className?:string}) { const Icon=icons[icon]??BookOpen; return <span className={cn('grid size-11 place-items-center rounded-xl',colors[color],className)}><Icon size={21}/></span>; }
