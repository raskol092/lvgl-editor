import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { applyThemeToProject } from '../utils/themeApply';
import type { Theme, ThemePreset, ThemeColors } from '../types';

const lightTheme: Theme = {
  id: 'light',
  name: 'Light theme',
  colors: {
    primary: '#2196F3',
    secondary: '#03A9F4',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#333333',
    border: '#e0e0e0',
  },
};

const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark theme',
  colors: {
    primary: '#90CAF9',
    secondary: '#4FC3F7',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#e0e0e0',
    border: '#333333',
  },
};

const presetThemes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

interface ThemeState {
  currentTheme: Theme;
  preset: ThemePreset;
  customThemes: Theme[];
  setTheme: (preset: ThemePreset, customId?: string) => void;
  createCustomTheme: (name: string, colors: ThemeColors) => Theme;
  updateCustomTheme: (id: string, patch: { name?: string; colors?: Partial<ThemeColors> }) => void;
  deleteCustomTheme: (id: string) => void;
}

export const builtinThemes: Theme[] = [lightTheme, darkTheme];

const STORAGE_KEY = 'lvgl-editor-themes';

function loadSaved(): { customThemes: Theme[]; currentTheme: Theme; preset: ThemePreset } {
  const fallback = { customThemes: [] as Theme[], currentTheme: lightTheme, preset: 'light' as ThemePreset };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || !Array.isArray(raw.customThemes)) return fallback;
    const customThemes: Theme[] = raw.customThemes.filter((x: Theme) => x && x.id && x.name && x.colors);
    if (raw.currentId === 'dark') return { customThemes, currentTheme: darkTheme, preset: 'dark' };
    const custom = customThemes.find(x => x.id === raw.currentId);
    if (custom) return { customThemes, currentTheme: custom, preset: 'custom' };
    return { ...fallback, customThemes };
  } catch {
    return fallback;
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...loadSaved(),

  setTheme: (preset, customId) => {
    const prev = get().currentTheme;
    let next: Theme | undefined;
    if (preset === 'custom' && customId) {
      next = get().customThemes.find(t => t.id === customId);
      if (next) set({ currentTheme: next, preset: 'custom' });
    } else if (presetThemes[preset]) {
      next = presetThemes[preset];
      set({ currentTheme: next, preset });
    }
    if (next && next.id !== prev.id) applyThemeToProject(prev.colors, next.colors);
  },

  createCustomTheme: (name, colors) => {
    const theme: Theme = { id: uuidv4(), name, colors };
    set(state => ({ customThemes: [...state.customThemes, theme] }));
    return theme;
  },

  updateCustomTheme: (id, patch) => {
    const before = get().currentTheme;
    set(state => {
      const customThemes = state.customThemes.map(x =>
        x.id === id ? { ...x, name: patch.name ?? x.name, colors: { ...x.colors, ...patch.colors } } : x);
      const updated = customThemes.find(x => x.id === id);
      return {
        customThemes,
        currentTheme: state.currentTheme.id === id && updated ? updated : state.currentTheme,
      };
    });
    const after = get().currentTheme;
    if (after.id === id && before.id === id) applyThemeToProject(before.colors, after.colors, false);
  },

  deleteCustomTheme: (id) => {
    const before = get().currentTheme;
    set(state => {
      const customThemes = state.customThemes.filter(x => x.id !== id);
      return state.currentTheme.id === id
        ? { customThemes, currentTheme: lightTheme, preset: 'light' as ThemePreset }
        : { customThemes };
    });
    if (before.id === id) applyThemeToProject(before.colors, lightTheme.colors);
  },
}));

useThemeStore.subscribe(state => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ customThemes: state.customThemes, currentId: state.currentTheme.id }));
  } catch { /* storage unavailable */ }
});

/**
 * Returns default style overrides for newly created components based on the current theme
 */
export function getThemeDefaultStyles(theme: Theme) {
  return {
    default: {
      bgColor: theme.colors.surface,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
    },
  };
}
