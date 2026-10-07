import type { LvglComponent, Page, ThemeColors } from '../types';
import { useEditorStore } from '../store/editorStore';

/** Colors every new component / page starts with (the built-in light look) — they follow the theme role they play. */
const LIGHT_ALIASES: Record<string, keyof ThemeColors> = {
  '#2196f3': 'primary',
  '#03a9f4': 'secondary',
  '#ffffff': 'background',
  '#f5f5f5': 'surface',
  '#fafafa': 'surface',
  '#f0f0f0': 'surface',
  '#333333': 'text',
  '#e0e0e0': 'border',
  '#cccccc': 'border',
};

/** Theme text color of the mapping currently being applied (set by withMap). */
const textTarget: { value: string | null } = { value: null };

function norm(c: string): string {
  const h = c.trim().toLowerCase();
  return /^#[0-9a-f]{3}$/.test(h) ? '#' + h.slice(1).split('').map(x => x + x).join('') : h;
}
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());

/** from-color -> to-color for every role (plus the light defaults as aliases of their role). */
export function buildColorMap(from: ThemeColors, to: ThemeColors): Map<string, string> {
  const map = new Map<string, string>();
  for (const [hex, role] of Object.entries(LIGHT_ALIASES)) map.set(hex, to[role]);
  for (const role of Object.keys(from) as Array<keyof ThemeColors>) map.set(norm(from[role]), to[role]);
  map.set('__text', to.text);
  map.set('__primary', to.primary);
  map.set('__background', to.background);
  return map;
}

/** Dark text colors components get by default; as *text* colors they follow the theme's text role. */
const DARK_TEXT = new Set(['#000000', '#212121', '#222222', '#333333']);

function mapDeep<T>(value: T, map: Map<string, string>, key = ''): T {
  if (isHex(value)) {
    const n = norm(value);
    if (/text|font/i.test(key) && DARK_TEXT.has(n) && textTarget.value) return textTarget.value as T;
    return (map.get(n) ?? value) as T;
  }
  if (Array.isArray(value)) return value.map(v => mapDeep(v, map, key)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = mapDeep(v, map, k);
    return out as T;
  }
  return value;
}

function isLightColor(hex: string): boolean {
  const h = norm(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export function themeComponent(comp: LvglComponent, map: Map<string, string>): LvglComponent {
  textTarget.value = map.get('__text') ?? null;
  let styles = mapDeep(comp.styles, map);
  // white button text is unreadable on a light primary color (dark themes): use the theme background instead
  const primary = map.get('__primary');
  const bg = map.get('__background');
  if (comp.type === 'btn' && primary && bg && isLightColor(primary)) {
    styles = Object.fromEntries(Object.entries(styles).map(([state, st]) => [
      state,
      st && typeof st === 'object' && st.textColor && norm(st.textColor) === '#ffffff' ? { ...st, textColor: bg } : st,
    ])) as typeof styles;
  }
  return {
    ...comp,
    styles,
    props: mapDeep(comp.props, map),
    children: comp.children.map(c => themeComponent(c, map)),
  };
}

function themePage(page: Page, map: Map<string, string>, to: ThemeColors): Page {
  return {
    ...page,
    backgroundColor: page.backgroundColor ? (map.has(norm(page.backgroundColor)) ? to.background : page.backgroundColor) : page.backgroundColor,
    components: page.components.map(c => themeComponent(c, map)),
  };
}

/** Re-colours the open project when the active theme changes: colors that played a theme role follow the new theme. */
export function applyThemeToProject(from: ThemeColors, to: ThemeColors, recordHistory = true) {
  const map = buildColorMap(from, to);
  const st = useEditorStore.getState();
  if (recordHistory) st.saveToHistory();
  useEditorStore.setState({ pages: st.pages.map(p => themePage(p, map, to)) });
}

/** A freshly created component starts in the light look; make it match the active theme. */
export function themeNewComponent(comp: LvglComponent, from: ThemeColors, to: ThemeColors): LvglComponent {
  return themeComponent(comp, buildColorMap(from, to));
}
