import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('studymate_theme') === 'dark' || (!localStorage.getItem('studymate_theme') && matchMedia('(prefers-color-scheme: dark)').matches));
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('studymate_theme', dark ? 'dark' : 'light'); }, [dark]);
  return <button className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={() => setDark(!dark)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>;
}
