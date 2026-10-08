import type React from 'react';
import type { LvglComponent, StyleProps } from '../../../types';
import type { ThemeColors } from '../../../types';

/** Everything a widget renderer of the design canvas needs from CanvasComponent. */
export interface RenderCtx {
  component: LvglComponent;
  props: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  type: string;
  styles: LvglComponent['styles'];
  defaultStyle: StyleProps;
  th: ThemeColors;
  tint: string;
  muted: string;
  defaultFontSize: number;
  children?: React.ReactNode;
  editing: boolean;
  textEditor: (color: string, fontSize: number | string) => React.ReactNode;
  resolvedBgColor: string | undefined;
  background: string | undefined;
  borderStyles: React.CSSProperties;
  paddingStyles: React.CSSProperties;
  outlineStyles: React.CSSProperties;
  canEditText: boolean;
  parentWidth?: number;
  parentHeight?: number;
  parentLayout?: string;
  isSelected: boolean;
  setEditing: (v: boolean) => void;
  updateComponent: (id: string, updates: Partial<LvglComponent>) => void;
}
