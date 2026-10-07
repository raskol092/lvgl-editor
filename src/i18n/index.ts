import { ru } from './ru';

export type Lang = 'en' | 'ru';
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ru', label: 'Русский' },
];

const STORAGE_KEY = 'lvgl-editor-lang';

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ru') return saved;
  } catch { /* ignore */ }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let current: Lang = detectLang();
if (typeof document !== 'undefined') document.documentElement.lang = current;

export function getLang(): Lang {
  return current;
}

/** Persist the language and reload so every module-level label is re-evaluated. */
export function setLang(lang: Lang): void {
  if (lang === current) return;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  window.location.reload();
}

/** Translate an English UI string. `{0}`, `{1}`… are replaced by the extra arguments. */
export function t(key: string, ...args: Array<string | number>): string {
  let s = current === 'ru' ? (ru[key] ?? key) : key;
  if (args.length) s = s.replace(/\{(\d+)\}/g, (m, i) => (args[+i] !== undefined ? String(args[+i]) : m));
  return s;
}
