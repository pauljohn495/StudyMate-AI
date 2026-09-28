import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn('flex items-center gap-2.5', className)}>
    <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"><Sparkles size={18} strokeWidth={2.5}/></span>
    {!compact && <span className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-white">StudyMate <span className="text-brand-600 dark:text-brand-400">AI</span></span>}
  </div>;
}
