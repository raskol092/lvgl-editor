import { t } from '../../i18n';
import type { LvglAlign } from '../../types';

// Align grid constants
export const ALIGN_OPTIONS: { value: LvglAlign; label: string; row: number; col: number }[] = [
  { value: 'top_left', label: '↖', row: 0, col: 0 },
  { value: 'top_mid', label: '↑', row: 0, col: 1 },
  { value: 'top_right', label: '↗', row: 0, col: 2 },
  { value: 'left_mid', label: '←', row: 1, col: 0 },
  { value: 'center', label: '·', row: 1, col: 1 },
  { value: 'right_mid', label: '→', row: 1, col: 2 },
  { value: 'bottom_left', label: '↙', row: 2, col: 0 },
  { value: 'bottom_mid', label: '↓', row: 2, col: 1 },
  { value: 'bottom_right', label: '↘', row: 2, col: 2 },
];

// Built-in LVGL fonts
export const BUILTIN_FONTS = [
  'montserrat_14',
  'montserrat_16',
  'montserrat_20',
  'montserrat_24',
  'montserrat_28',
  'montserrat_32',
];

// Style section visibility per component type (Task 2)
export const STYLE_SECTION_VISIBILITY: Record<string, Set<string>> = {
  shadow: new Set(['btn', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'table', 'chart', 'calendar', 'bar', 'arc', 'roller', 'spinbox', 'keyboard', 'list', 'msgbox', 'scale']),
  transform: new Set(['btn', 'label', 'img', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'checkbox', 'switch', 'slider', 'bar', 'arc', 'spinner', 'chart', 'table', 'calendar', 'roller', 'spinbox', 'keyboard', 'list', 'msgbox', 'scale']),
  gradient: new Set(['btn', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'bar', 'slider']),
  outline: new Set(['btn', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'checkbox', 'switch', 'slider', 'bar', 'arc', 'table', 'chart', 'calendar', 'roller', 'spinbox', 'keyboard', 'list', 'msgbox', 'scale']),
  scrollbar: new Set(['obj', 'tabview', 'tileview', 'win', 'textarea']),
  textStyle: new Set(['btn', 'label', 'textarea', 'dropdown', 'checkbox', 'table', 'calendar', 'roller', 'spinbox', 'list', 'msgbox']),
  blendMode: new Set(['btn', 'label', 'img', 'obj', 'chart']),
};

// Flags that only apply to container-like components
export const SCROLL_FLAGS = new Set(['scrollable', 'scrollElastic', 'scrollMomentum', 'scrollOnFocus', 'scrollOne', 'scrollChainHor', 'scrollChainVer', 'scrollWithArrow']);
export const CONTAINER_TYPES = new Set(['obj', 'tabview', 'tileview', 'win']);

// Helper to check if a style section should be visible for a component type
export function isSectionVisible(section: string, componentType: string): boolean {
  const allowed = STYLE_SECTION_VISIBILITY[section];
  return !allowed || allowed.has(componentType);
}

export type StyleState = 'default' | 'pressed' | 'focused' | 'disabled' | 'checked' | 'hovered' | 'edited' | 'scrolled';

export const STYLE_STATES: { key: StyleState; label: string }[] = [
  { key: 'default', label: t('Default') },
  { key: 'pressed', label: t('Press') },
  { key: 'focused', label: t('Focused state') },
  { key: 'disabled', label: t('Disabled') },
  { key: 'checked', label: t('Checked') },
  { key: 'hovered', label: t('Hovered') },
  { key: 'edited', label: t('Edited') },
  { key: 'scrolled', label: t('Scrolled') },
];

export const PART_LABELS: Record<string, string> = {
  indicator: t('Indicator'), knob: t('Knob'), items: t('Items'), selected: t('Selected'), cursor: t('Cursor'), scrollbar: t('Scrollbar'),
};

// Built-in font sizes (matching montserrat available sizes)
export const BUILTIN_FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48];
