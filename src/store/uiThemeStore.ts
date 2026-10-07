import { create } from 'zustand';

export type UiThemeMode = 'system' | 'light' | 'dark';

const KEY = 'lvgl-editor-ui-theme';

function load(): UiThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* storage unavailable */ }
  return 'system';
}

const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function resolveUiTheme(mode: UiThemeMode): 'light' | 'dark' {
  if (mode === 'system') return media?.matches === false ? 'light' : 'dark';
  return mode;
}

function apply(mode: UiThemeMode) {
  document.documentElement.setAttribute('data-theme', resolveUiTheme(mode));
}

interface UiThemeState {
  mode: UiThemeMode;
  setMode: (mode: UiThemeMode) => void;
}

/** Look of the editor itself (not the generated UI): follows the OS unless set explicitly. */
export const useUiThemeStore = create<UiThemeState>((set) => ({
  mode: load(),
  setMode: (mode) => {
    try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
    apply(mode);
    set({ mode });
  },
}));

export function initUiTheme() {
  apply(useUiThemeStore.getState().mode);
  media?.addEventListener?.('change', () => {
    if (useUiThemeStore.getState().mode === 'system') apply('system');
  });
}
