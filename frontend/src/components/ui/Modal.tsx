import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose(): void; title: string; description?: string; children: ReactNode }) {
  useEffect(() => { const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-float dark:bg-slate-900 sm:rounded-3xl">
      <div className="mb-6 flex items-start justify-between gap-4"><div><h2 id="modal-title" className="font-display text-xl font-extrabold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div><button aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button></div>
      {children}
    </section>
  </div>;
}
