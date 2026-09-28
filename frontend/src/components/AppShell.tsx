import { BookCopy, BookOpen, Bot, CalendarDays, ChevronDown, Download, FileCheck2, FileStack, Gauge, GraduationCap, Library, Menu, PanelLeftClose, PanelLeftOpen, Settings, TrendingUp, WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn, initials } from '../lib/utils';
import { useAuth } from '../store/AuthContext';
import { usePwa } from '../store/PwaContext';
import { GlobalSearch } from './GlobalSearch';
import { Logo } from './ui/Logo';
import { ThemeToggle } from './ui/ThemeToggle';

const nav=[
  {label:'Dashboard',to:'/app',icon:Gauge,end:true},{label:'Subjects',to:'/app/subjects',icon:Library},{label:'Study materials',to:'/app/materials',icon:FileStack},{label:'Reviewers',to:'/app/reviewers',icon:BookCopy},{label:'Flashcards',to:'/app/flashcards',icon:BookOpen},{label:'Quizzes',to:'/app/quizzes',icon:GraduationCap},{label:'AI tutor',to:'/app/tutor',icon:Bot},{label:'Practice exams',to:'/app/exams',icon:FileCheck2},{label:'Study planner',to:'/app/planner',icon:CalendarDays},{label:'Progress',to:'/app/progress',icon:TrendingUp}
];
const mobileNav=[nav[0]!,nav[1]!,nav[6]!,nav[8]!,nav[9]!];

function Sidebar({mobile,compact,close}:{mobile?:boolean;compact?:boolean;close?():void}){
  const {user,logout,isDemo}=useAuth();const navigate=useNavigate();
  return <aside className={cn('flex h-full flex-col border-r bg-white px-3.5 py-5 transition-[width] dark:bg-slate-950',mobile?'w-full border-r-0':compact?'w-20':'w-[264px]')}>
    <div className={cn('mb-7 flex h-9 items-center px-2',compact?'justify-center overflow-hidden':'justify-between')}>{compact?<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 font-display text-sm font-extrabold text-white" aria-label="StudyMate">S</span>:<Logo/>}{mobile&&<button type="button" onClick={close} className="grid size-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close navigation"><X size={20}/></button>}</div>
    <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
      {nav.map(({label,to,icon:Icon,end})=><NavLink key={to} to={to} end={end} title={compact?label:undefined} aria-label={compact?label:undefined} onClick={close} className={({isActive})=>cn('group flex h-11 items-center rounded-xl text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white',compact?'justify-center px-2':'gap-3 px-3',isActive&&'bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-brand-500/10 dark:text-brand-300')}><Icon size={19} strokeWidth={2}/>{!compact&&<span>{label}</span>}</NavLink>)}
    </nav>
    <div className="mt-4 border-t pt-4">
      <NavLink to="/app/settings" title={compact?'Settings':undefined} aria-label={compact?'Settings':undefined} onClick={close} className={cn('flex h-11 items-center rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900',compact?'justify-center px-2':'gap-3 px-3')}><Settings size={19}/>{!compact&&'Settings'}</NavLink>
      <button type="button" onClick={()=>{logout();navigate('/');}} title={compact?'Sign out':undefined} className={cn('mt-2 flex w-full items-center rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-900',compact?'justify-center':'gap-3')}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-extrabold text-white dark:bg-brand-600">{initials(user?.name??'')}</span>{!compact&&<><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{user?.name}</span><span className="block truncate text-xs text-slate-400">{isDemo?'Demo workspace':user?.email}</span></span><ChevronDown size={15} className="text-slate-400"/></>}</button>
    </div>
  </aside>;
}

export function AppShell(){
  const [mobileOpen,setMobileOpen]=useState(false);const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('studymate_sidebar_collapsed')==='true');
  const {isDemo}=useAuth();const {canInstall,install,isOnline}=usePwa();
  const toggle=()=>setCollapsed(value=>{localStorage.setItem('studymate_sidebar_collapsed',String(!value));return !value;});
  return <div className="min-h-screen bg-canvas dark:bg-slate-950">
    <a href="#main-content" className="sr-only z-[100] rounded-xl bg-white px-4 py-2 font-bold text-brand-700 shadow-float focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
    <div className="fixed inset-y-0 left-0 z-30 hidden lg:block"><Sidebar compact={collapsed}/></div>
    {mobileOpen&&<div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden" onMouseDown={event=>event.target===event.currentTarget&&setMobileOpen(false)}><div className="h-full w-[285px] shadow-float"><Sidebar mobile close={()=>setMobileOpen(false)}/></div></div>}
    <div className={cn('transition-[padding] lg:pl-[264px]',collapsed&&'lg:pl-20')}>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur-xl dark:bg-slate-950/90 sm:px-6 lg:px-8">
        <button type="button" onClick={()=>setMobileOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" aria-label="Open navigation"><Menu size={21}/></button>
        <button type="button" onClick={toggle} className="hidden size-10 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-800 lg:grid" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</button>
        <GlobalSearch/>
        {!isOnline&&<span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 sm:flex"><WifiOff size={12}/>Offline</span>}
        {canInstall&&<button type="button" onClick={()=>void install()} className="hidden h-9 items-center gap-2 rounded-xl bg-brand-50 px-3 text-xs font-extrabold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 sm:flex"><Download size={15}/>Install</button>}
        {isDemo&&<span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 sm:block">Demo mode</span>}
        <ThemeToggle/>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1440px] px-4 py-6 pb-24 outline-none sm:px-6 lg:px-8 lg:py-8"><Outlet/></main>
    </div>
    <nav aria-label="Mobile primary" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border bg-white/95 p-1.5 shadow-float backdrop-blur-xl dark:bg-slate-950/95 lg:hidden">{mobileNav.map(({label,to,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>cn('flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold text-slate-500',isActive&&'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300')}><Icon size={18}/><span className="max-w-full truncate">{label.replace('Study ','')}</span></NavLink>)}</nav>
  </div>;
}
