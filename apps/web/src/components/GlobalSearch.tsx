import { BookCopy, BookOpen, CalendarDays, FileCheck2, FileStack, GraduationCap, Library, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../lib/api';
import { demoDocuments, demoExams, demoFlashcardDecks, demoLessons, demoQuizzes, demoReviewers, demoStudyPlans, demoSubjects } from '../lib/demo';
import { useAuth } from '../store/AuthContext';
import type { ApiResponse, SearchResult } from '../types';

const icons={subject:Library,lesson:BookOpen,material:FileStack,reviewer:BookCopy,flashcards:BookOpen,quiz:GraduationCap,exam:FileCheck2,plan:CalendarDays};

function demoResults(query:string):SearchResult[]{
  const subjects=demoSubjects();
  const subjectNames=new Map(subjects.map(item=>[item.id,item.name]));
  const lessons=Object.values(demoLessons()).flat();
  const lessonNames=new Map(lessons.map(item=>[item.id,item.title]));
  const values:SearchResult[]=[
    ...subjects.map(item=>({id:item.id,type:'subject' as const,title:item.name,subtitle:item.description??'Subject',href:`/app/subjects/${item.id}`})),
    ...lessons.map(item=>({id:item.id,type:'lesson' as const,title:item.title,subtitle:subjectNames.get(item.subject_id)??'Lesson',href:`/app/lessons/${item.id}`})),
    ...Object.values(demoDocuments()).flat().map(item=>({id:item.id,type:'material' as const,title:item.original_name,subtitle:lessonNames.get(item.lesson_id)??'Study material',href:`/app/lessons/${item.lesson_id}`})),
    ...demoReviewers().map(item=>({id:item.id,type:'reviewer' as const,title:item.title,subtitle:item.lesson_title??'Reviewer',href:'/app/reviewers'})),
    ...Object.values(demoFlashcardDecks()).map(item=>({id:item.deck.id,type:'flashcards' as const,title:item.deck.title,subtitle:item.deck.lesson_title??'Flashcards',href:`/app/flashcards/${item.deck.id}/study`})),
    ...Object.values(demoQuizzes()).map(item=>({id:item.quiz.id,type:'quiz' as const,title:item.quiz.title,subtitle:item.quiz.lesson_title??'Quiz',href:`/app/quizzes/${item.quiz.id}/take`})),
    ...Object.values(demoExams()).map(item=>({id:item.exam.id,type:'exam' as const,title:item.exam.title,subtitle:'Practice exam',href:`/app/exams/${item.exam.id}/take`})),
    ...Object.values(demoStudyPlans()).map(item=>({id:item.plan.id,type:'plan' as const,title:item.plan.title,subtitle:item.plan.subject_name??'Study plan',href:`/app/planner/${item.plan.id}`}))
  ];
  const term=query.toLowerCase();
  return values.filter(item=>`${item.title} ${item.subtitle}`.toLowerCase().includes(term)).slice(0,24);
}

export function GlobalSearch(){
  const {isDemo}=useAuth();
  const [open,setOpen]=useState(false);const [query,setQuery]=useState('');const [results,setResults]=useState<SearchResult[]>([]);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(true);}if(event.key==='Escape')setOpen(false);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
  useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),0);else{setQuery('');setResults([]);setError('');}},[open]);
  useEffect(()=>{if(!open||query.trim().length<2){setResults([]);setLoading(false);return;}const controller=new AbortController();const timer=setTimeout(async()=>{setLoading(true);setError('');try{if(isDemo)setResults(demoResults(query.trim()));else{const {data}=await api.get<ApiResponse<SearchResult[]>>('/search',{params:{q:query.trim()},signal:controller.signal});setResults(data.data);}}catch(error){if(!controller.signal.aborted)setError(apiMessage(error));}finally{if(!controller.signal.aborted)setLoading(false);}},250);return()=>{clearTimeout(timer);controller.abort();};},[isDemo,open,query]);
  const status=useMemo(()=>query.trim().length<2?'Type at least two characters to search.':loading?'Searching…':error||`${results.length} result${results.length===1?'':'s'} found.`,[error,loading,query,results.length]);
  return <>
    <button type="button" onClick={()=>setOpen(true)} className="flex h-10 max-w-lg flex-1 items-center gap-3 rounded-xl bg-slate-100 px-3 text-left text-sm text-slate-400 outline-none transition hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-slate-900 dark:hover:bg-slate-800" aria-haspopup="dialog"><Search size={17}/><span className="min-w-0 flex-1 truncate">Search subjects, lessons, notes…</span><kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800 sm:block">Ctrl K</kbd></button>
    {open&&<div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/55 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={event=>event.target===event.currentTarget&&setOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="workspace-search-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-float dark:bg-slate-950">
      <h2 id="workspace-search-title" className="sr-only">Search your workspace</h2>
      <div className="flex items-center gap-3 border-b px-4"><Search size={19} className="text-slate-400"/><input ref={inputRef} value={query} onChange={event=>setQuery(event.target.value)} className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search your workspace…" aria-describedby="search-status"/><button type="button" onClick={()=>setOpen(false)} className="grid size-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close search"><X size={18}/></button></div>
      <p id="search-status" className="sr-only" role="status" aria-live="polite">{status}</p>
      <div className="max-h-[55vh] overflow-y-auto p-2">
        {query.trim().length<2&&<p className="px-3 py-10 text-center text-sm text-slate-500">Type at least two characters to search across your workspace.</p>}
        {loading&&<div className="space-y-2 p-2" aria-hidden="true">{[1,2,3].map(item=><div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>)}</div>}
        {!loading&&error&&<p className="px-3 py-10 text-center text-sm text-rose-600">{error}</p>}
        {!loading&&!error&&query.trim().length>=2&&!results.length&&<p className="px-3 py-10 text-center text-sm text-slate-500">No matching study resources found.</p>}
        {!loading&&results.map(item=>{const Icon=icons[item.type];return <Link key={`${item.type}-${item.id}`} to={item.href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-900"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.title}</span><span className="block truncate text-xs text-slate-400">{item.subtitle}</span></span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800">{item.type}</span></Link>;})}
      </div>
    </section></div>}
  </>;
}
