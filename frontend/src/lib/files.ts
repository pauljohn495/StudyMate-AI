export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B','KB','MB','GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

export const extensionOf = (name: string) => name.split('.').pop()?.toUpperCase() ?? 'FILE';

export const documentTone = (name: string) => {
  const extension = extensionOf(name);
  if (extension === 'PDF') return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300';
  if (extension === 'DOCX') return 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300';
  if (extension === 'PPTX') return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};
