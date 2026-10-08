// ui/ui.lisp generator: screens, widgets, styles and animations

import { styleSelector } from '../../utils/styleKeys';
import type { Page, LvglComponent, StyleProps, Animation, Theme } from '../../types';
import type { ImageResource, FontResource } from '../../resources/types';
import type { LispGenOptions } from './types';
import type { NameResolver } from './names';
import { EXTRA_CREATE_FN, extraPropsForms } from './extraWidgets';
import { isDarkTheme } from '../../utils/isDarkTheme';
import { getArcStyle, isArcLike } from '../../utils/arcStyle';
import { sym, lstr, lcolor, lopa, indent, comment, banner, userCode, shift, symbolText } from './sexp';

export interface UiContext {
  options: LispGenOptions;
  names: NameResolver;
  imageResources: ImageResource[];
  fontResources: FontResource[];
  defaultFont?: string;
  defaultFontSize?: number;
  /** image resource id -> palette produced by the asset converter (index 0 = transparent) */
  imagePalettes?: Record<string, Array<number | null>>;
  /** color for library icons (theme text color) */
  iconColor?: string;
}

/** Built-in Montserrat sizes available on the P4 board */
const BUILTIN_SIZES = [14, 16, 20, 24, 32, 48];

const isBuiltinFont = (name: string) => /^montserrat_\d+$/.test(name);

// ---------------------------------------------------------------- resources

export function findImage(src: string | undefined, images: ImageResource[]): ImageResource | undefined {
  if (!src) return undefined;
  return images.find(i => i.id === src || i.name === src);
}

/** Symbol bound by `(import ...)` in main.lisp to the raw bytes of an image. */
export function imageDataSym(img: ImageResource, o: LispGenOptions): string {
  return sym(o, 'ui', 'img', img.cArrayName);
}

export function fontDataSym(fontName: string, size: number, o: LispGenOptions): string {
  return sym(o, 'ui', 'fontdata', fontName, size);
}

function fontSym(fontName: string, size: number, o: LispGenOptions): string {
  return sym(o, 'ui', 'font', fontName, size);
}

export function collectUsedImages(pages: Page[], images: ImageResource[]): ImageResource[] {
  const used = new Set<string>();
  const walk = (cs: LvglComponent[]) => {
    for (const c of cs) {
      if (c.type === 'img') {
        const m = findImage(c.props.src, images);
        if (m) used.add(m.id);
      }
      walk(c.children);
    }
  };
  pages.forEach(p => walk(p.components));
  return images.filter(i => used.has(i.id));
}

/** Custom font + size combinations that are referenced by components (or the project default). */
export function collectUsedCustomFonts(
  pages: Page[],
  fonts: FontResource[],
  defaultFont?: string,
  defaultFontSize?: number
): Map<string, Set<number>> {
  const used = new Map<string, Set<number>>();
  const custom = new Set(fonts.map(f => f.cFontName));
  const add = (name: string, size: number) => {
    if (!used.has(name)) used.set(name, new Set());
    used.get(name)!.add(size);
  };
  const walk = (cs: LvglComponent[]) => {
    for (const c of cs) {
      if (c.props.fontResource) {
        const n = c.props.fontResource as string;
        if (!isBuiltinFont(n) && custom.has(n)) add(n, (c.props.fontSize as number) || 16);
      } else if (c.props.fontSize !== undefined && defaultFont && !isBuiltinFont(defaultFont) && custom.has(defaultFont)) {
        const s = c.props.fontSize as number;
        if (s !== (defaultFontSize || 16)) add(defaultFont, s);
      }
      const states: Array<StyleProps | undefined> = Object.values(c.styles);
      for (const st of states) {
        if (st?.textFont && !isBuiltinFont(st.textFont) && custom.has(st.textFont)) add(st.textFont, st.textFontSize || 16);
      }
      walk(c.children);
    }
  };
  pages.forEach(p => walk(p.components));
  if (defaultFont && !isBuiltinFont(defaultFont) && custom.has(defaultFont)) add(defaultFont, defaultFontSize || 16);
  return used;
}

// ---------------------------------------------------------------- styles

/** Lisp expression for a font; undefined when it equals the project default. */
function fontExpr(name: string, size: number | undefined, ctx: UiContext): string | undefined {
  const m = /^montserrat_(\d+)$/.exec(name);
  if (m) return name === ctx.defaultFont ? undefined : `font-montserrat-${m[1]}`;
  const s = size || 16;
  if (name === ctx.defaultFont && s === (ctx.defaultFontSize || 16)) return undefined;
  return fontSym(name, s, ctx.options);
}

function styleForms(v: string, st: StyleProps, selector: string, ctx: UiContext): string[] {
  const out: string[] = [];
  const set = (fn: string, value: string | number) => out.push(`(lv-obj-set-style-${fn} ${v} ${value} ${selector})`);

  if (st.bgColor) {
    if (st.bgColor.toLowerCase() === 'transparent') {
      set('bg-opa', 'LV_OPA_TRANSP');
    } else {
      set('bg-color', lcolor(st.bgColor));
      set('bg-opa', 'LV_OPA_COVER');
    }
  }
  if (st.borderColor) set('border-color', lcolor(st.borderColor));
  if (st.borderWidth !== undefined) set('border-width', st.borderWidth);
  if (st.borderRadius !== undefined) set('radius', st.borderRadius);
  if (st.textColor) set('text-color', lcolor(st.textColor));
  if (st.imageRecolor) {
    set('image-recolor', lcolor(st.imageRecolor));
    set('image-recolor-opa', 'LV_OPA_COVER');
  }
  if (st.opacity !== undefined && st.opacity < 1) set('opa', lopa(st.opacity));
  // size limits, margins, gaps, offsets, per-part opacity (all optional)
  const opt: Array<[keyof StyleProps, string, (n: number) => number]> = [
    ['minWidth', 'min-width', n => n], ['maxWidth', 'max-width', n => n], ['minHeight', 'min-height', n => n], ['maxHeight', 'max-height', n => n],
    ['marginTop', 'margin-top', n => n], ['marginBottom', 'margin-bottom', n => n], ['marginLeft', 'margin-left', n => n], ['marginRight', 'margin-right', n => n],
    ['padRow', 'pad-row', n => n], ['padColumn', 'pad-column', n => n],
    ['translateX', 'translate-x', n => n], ['translateY', 'translate-y', n => n],
    ['skewX', 'transform-skew-x', n => Math.round(n * 10)], ['skewY', 'transform-skew-y', n => Math.round(n * 10)],
    ['bgOpa', 'bg-opa', n => Math.max(0, Math.min(255, Math.round(n)))], ['borderOpa', 'border-opa', n => Math.max(0, Math.min(255, Math.round(n)))],
    ['outlineOpa', 'outline-opa', n => Math.max(0, Math.min(255, Math.round(n)))], ['textOpa', 'text-opa', n => Math.max(0, Math.min(255, Math.round(n)))],
    ['textOutlineWidth', 'text-outline-stroke-width', n => n],
    ['transformWidth', 'transform-width', n => n], ['transformHeight', 'transform-height', n => n],
    ['bgMainStop', 'bg-main-stop', n => Math.max(0, Math.min(255, Math.round(n)))], ['blurRadius', 'blur-radius', n => Math.max(0, Math.round(n))],
  ];
  for (const [key, fn, conv] of opt) {
    const val = st[key];
    if (typeof val === 'number' && Number.isFinite(val)) set(fn, conv(val));
  }
  if (st.clipCorner === true) set('clip-corner', 't');
  if (st.borderPost === true) set('border-post', 't');
  if (st.textOutlineWidth && st.textOutlineColor) set('text-outline-stroke-color', lcolor(st.textOutlineColor));
  if (st.padding !== undefined) {
    for (const side of ['top', 'bottom', 'left', 'right']) set(`pad-${side}`, st.padding);
  }
  if (st.paddingTop !== undefined) set('pad-top', st.paddingTop);
  if (st.paddingBottom !== undefined) set('pad-bottom', st.paddingBottom);
  if (st.paddingLeft !== undefined) set('pad-left', st.paddingLeft);
  if (st.paddingRight !== undefined) set('pad-right', st.paddingRight);

  if (st.borderSide && st.borderSide !== 'full') {
    const sides: Record<string, string> = {
      none: 'LV_BORDER_SIDE_NONE',
      top: 'LV_BORDER_SIDE_TOP',
      bottom: 'LV_BORDER_SIDE_BOTTOM',
      left: 'LV_BORDER_SIDE_LEFT',
      right: 'LV_BORDER_SIDE_RIGHT',
      top_bottom: '(bitwise-or LV_BORDER_SIDE_TOP LV_BORDER_SIDE_BOTTOM)',
      left_right: '(bitwise-or LV_BORDER_SIDE_LEFT LV_BORDER_SIDE_RIGHT)',
    };
    if (sides[st.borderSide]) set('border-side', sides[st.borderSide]);
  }

  if (st.bgGradDir && st.bgGradDir !== 'none') {
    set('bg-grad-dir', st.bgGradDir === 'hor' ? 'LV_GRAD_DIR_HOR' : 'LV_GRAD_DIR_VER');
    if (st.bgGradColor) set('bg-grad-color', lcolor(st.bgGradColor));
    if (st.bgGradStop !== undefined) set('bg-grad-stop', st.bgGradStop);
  }

  if (st.outlineWidth !== undefined && st.outlineWidth > 0) {
    set('outline-width', st.outlineWidth);
    if (st.outlineColor) set('outline-color', lcolor(st.outlineColor));
    if (st.outlinePad !== undefined) set('outline-pad', st.outlinePad);
  }

  if (st.shadowWidth !== undefined && st.shadowWidth > 0) {
    set('shadow-width', st.shadowWidth);
    if (st.shadowColor) set('shadow-color', lcolor(st.shadowColor));
    if (st.shadowOffsetX) set('shadow-offset-x', st.shadowOffsetX);
    if (st.shadowOffsetY) set('shadow-offset-y', st.shadowOffsetY);
    if (st.shadowSpread) set('shadow-spread', st.shadowSpread);
    if (st.shadowOpacity !== undefined && st.shadowOpacity < 255) set('shadow-opa', st.shadowOpacity);
  }

  if (st.transformAngle) set('transform-rotation', st.transformAngle);
  if (st.transformZoomX !== undefined && st.transformZoomX !== 256) set('transform-scale-x', st.transformZoomX);
  if (st.transformZoomY !== undefined && st.transformZoomY !== 256) set('transform-scale-y', st.transformZoomY);
  if (st.transformPivotX) set('transform-pivot-x', st.transformPivotX);
  if (st.transformPivotY) set('transform-pivot-y', st.transformPivotY);

  if (st.textFont) {
    const f = fontExpr(st.textFont, st.textFontSize, ctx);
    if (f) set('text-font', f);
  }
  if (st.textLetterSpace) set('text-letter-space', st.textLetterSpace);
  if (st.textLineSpace) set('text-line-space', st.textLineSpace);

  if (st.textDecor && st.textDecor !== 'none') {
    set('text-decor', st.textDecor === 'underline' ? 'LV_TEXT_DECOR_UNDERLINE' : 'LV_TEXT_DECOR_STRIKETHROUGH');
  }
  if (st.blendMode && st.blendMode !== 'normal') {
    const modes: Record<string, string> = {
      additive: 'LV_BLEND_MODE_ADDITIVE',
      subtractive: 'LV_BLEND_MODE_SUBTRACTIVE',
      multiply: 'LV_BLEND_MODE_MULTIPLY',
    };
    if (modes[st.blendMode]) set('blend-mode', modes[st.blendMode]);
  }
  return out;
}

// ---------------------------------------------------------------- widgets

const CREATE_FN: Record<string, string> = {
  btn: 'lv-button-create',
  label: 'lv-label-create',
  img: 'lv-image-create',
  line: 'lv-line-create',
  textarea: 'lv-textarea-create',
  dropdown: 'lv-dropdown-create',
  checkbox: 'lv-checkbox-create',
  switch: 'lv-switch-create',
  slider: 'lv-slider-create',
  obj: 'lv-obj-create',
  tabview: 'lv-tabview-create',
  tileview: 'lv-tileview-create',
  win: 'lv-win-create',
  bar: 'lv-bar-create',
  led: 'lv-led-create',
  arc: 'lv-arc-create',
  spinner: 'lv-spinner-create',
  chart: 'lv-chart-create',
  table: 'lv-table-create',
  calendar: 'lv-calendar-create',
};

const DIR: Record<string, string> = { top: 'LV_DIR_TOP', bottom: 'LV_DIR_BOTTOM', left: 'LV_DIR_LEFT', right: 'LV_DIR_RIGHT' };

/** Text-related props shared by label-like widgets. */
function textProps(v: string, props: Record<string, any>, ctx: UiContext): string[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const out: string[] = [];
  const set = (fn: string, value: string | number) => out.push(`(lv-obj-set-style-${fn} ${v} ${value} LV_PART_MAIN)`);
  if (props.fontResource) {
    const f = fontExpr(props.fontResource as string, props.fontSize as number | undefined, ctx);
    if (f) set('text-font', f);
  } else if (props.fontSize !== undefined && ctx.defaultFont && !isBuiltinFont(ctx.defaultFont)) {
    const s = props.fontSize as number;
    if (s !== (ctx.defaultFontSize || 16)) set('text-font', fontSym(ctx.defaultFont, s, ctx.options));
  } else if (props.fontSize !== undefined && Number.isFinite(Number(props.fontSize))) {
    // built-in Montserrat: the nearest size the board has (the P4 firmware ships 14 16 20 24 32 48)
    const want = Number(props.fontSize);
    const size = BUILTIN_SIZES.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const def = /^montserrat_(\d+)$/.exec(ctx.defaultFont || '');
    if (size !== (def ? Number(def[1]) : 14)) set('text-font', `font-montserrat-${size}`);
  }
  if (props.textAlign) {
    const al: Record<string, string> = { left: 'LV_TEXT_ALIGN_LEFT', center: 'LV_TEXT_ALIGN_CENTER', right: 'LV_TEXT_ALIGN_RIGHT' };
    set('text-align', al[props.textAlign] || 'LV_TEXT_ALIGN_CENTER');
  }
  return out;
}

function propsForms(comp: LvglComponent, v: string, ctx: UiContext): string[] {
  const o = ctx.options;
  const props = comp.props as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const out: string[] = [];
  const num = (x: unknown, d = 0) => (Number.isFinite(Number(x)) ? Number(x) : d);

  switch (comp.type) {
    case 'label': {
      if (props.text) out.push(`(lv-label-set-text ${v} ${lstr(props.text)})`);
      if (props.longMode) {
        const m: Record<string, string> = {
          wrap: 'LV_LABEL_LONG_MODE_WRAP', scroll: 'LV_LABEL_LONG_MODE_SCROLL',
          dot: 'LV_LABEL_LONG_MODE_DOTS', clip: 'LV_LABEL_LONG_MODE_CLIP',
          scroll_circular: 'LV_LABEL_LONG_MODE_SCROLL_CIRCULAR',
        };
        out.push(`(lv-label-set-long-mode ${v} ${m[props.longMode] || 'LV_LABEL_LONG_MODE_WRAP'})`);
      }
      if (props.recolor === true) out.push(`(lv-label-set-recolor ${v} t)`);
      out.push(...textProps(v, props, ctx));
      break;
    }
    case 'btn': {
      if (props.text) {
        const l = `${v}${o.namingStyle === 'snake_case' ? '_' : '-'}label`;
        out.push(`(def ${l} (lv-label-create ${v}))`);
        out.push(`(lv-label-set-text ${l} ${lstr(props.text)})`);
        out.push(`(lv-obj-center ${l})`);
        out.push(...textProps(l, props, ctx));
      }
      break;
    }
    case 'led': {
      if (props.color) out.push(`(lv-led-set-color ${v} ${lcolor(props.color)})`);
      out.push(props.checked === false ? `(lv-led-off ${v})` : `(lv-led-on ${v})`);
      const b = Number(props.brightness ?? 255);
      if (Number.isFinite(b) && b !== 255 && props.checked !== false) out.push(`(lv-led-set-brightness ${v} ${Math.max(0, Math.min(255, Math.round(b)))})`);
      break;
    }
    case 'slider':
    case 'bar': {
      const p = comp.type === 'slider' ? 'slider' : 'bar';
      if (props.min !== undefined || props.max !== undefined) out.push(`(lv-${p}-set-range ${v} ${num(props.min)} ${num(props.max, 100)})`);
      if (props.mode && props.mode !== 'normal') {
        out.push(`(lv-${p}-set-mode ${v} LV_${p.toUpperCase()}_MODE_${props.mode === 'range' ? 'RANGE' : 'SYMMETRICAL'})`);
      }
      if (props.mode === 'range' && props.startValue !== undefined) out.push(`(lv-${p}-set-start-value ${v} ${num(props.startValue)} LV_ANIM_OFF)`);
      if (props.value !== undefined) out.push(`(lv-${p}-set-value ${v} ${num(props.value)} LV_ANIM_OFF)`);
      if (props.orientation === 'vertical') out.push(`(lv-obj-set-style-transform-rotation ${v} 900 LV_PART_MAIN)`);
      if (props.indicatorColor) {
        out.push(`(lv-obj-set-style-bg-color ${v} ${lcolor(props.indicatorColor)} LV_PART_INDICATOR)`);
        out.push(`(lv-obj-set-style-bg-opa ${v} LV_OPA_COVER LV_PART_INDICATOR)`);
        if (comp.type === 'slider') out.push(`(lv-obj-set-style-bg-color ${v} ${lcolor(props.indicatorColor)} LV_PART_KNOB)`);
      }
      break;
    }
    case 'arc': {
      if (props.startAngle !== undefined || props.endAngle !== undefined) {
        out.push(`(lv-arc-set-bg-angles ${v} ${num(props.startAngle, 135)} ${num(props.endAngle, 45)})`);
      }
      if (props.min !== undefined || props.max !== undefined) out.push(`(lv-arc-set-range ${v} ${num(props.min)} ${num(props.max, 100)})`);
      if (props.value !== undefined) out.push(`(lv-arc-set-value ${v} ${num(props.value)})`);
      if (props.rotation) out.push(`(lv-arc-set-rotation ${v} ${Math.round(num(props.rotation))})`);
      if (props.changeRate !== undefined && num(props.changeRate) !== 720) out.push(`(lv-arc-set-change-rate ${v} ${Math.max(0, Math.round(num(props.changeRate)))})`);
      if (props.rounded !== undefined) {
        const r = props.rounded === false ? 'nil' : 't';
        out.push(`(lv-obj-set-style-arc-rounded ${v} ${r} LV_PART_MAIN)`, `(lv-obj-set-style-arc-rounded ${v} ${r} LV_PART_INDICATOR)`);
      }
      if (props.hideKnob === true) out.push(`(lv-obj-set-style-bg-opa ${v} LV_OPA_TRANSP LV_PART_KNOB)`);
      if (props.mode) {
        const m: Record<string, string> = { normal: 'LV_ARC_MODE_NORMAL', symmetrical: 'LV_ARC_MODE_SYMMETRICAL', reverse: 'LV_ARC_MODE_REVERSE' };
        out.push(`(lv-arc-set-mode ${v} ${m[props.mode] || 'LV_ARC_MODE_NORMAL'})`);
      }
      break;
    }
    case 'checkbox': {
      if (props.text) out.push(`(lv-checkbox-set-text ${v} ${lstr(props.text)})`);
      if (props.checked) out.push(`(lv-obj-add-state ${v} LV_STATE_CHECKED)`);
      out.push(...textProps(v, props, ctx));
      break;
    }
    case 'switch': {
      if (props.checked) out.push(`(lv-obj-add-state ${v} LV_STATE_CHECKED)`);
      if (props.orientation === 'horizontal' || props.orientation === 'vertical') {
        out.push(`(lv-switch-set-orientation ${v} LV_SWITCH_ORIENTATION_${props.orientation.toUpperCase()})`);
      }
      break;
    }
    case 'textarea': {
      if (props.placeholder) out.push(`(lv-textarea-set-placeholder-text ${v} ${lstr(props.placeholder)})`);
      if (props.text) out.push(`(lv-textarea-set-text ${v} ${lstr(props.text)})`);
      if (props.maxLength && props.maxLength > 0) out.push(`(lv-textarea-set-max-length ${v} ${num(props.maxLength)})`);
      if (props.password) out.push(`(lv-textarea-set-password-mode ${v} t)`);
      if (props.password && props.passwordShowTime !== undefined && num(props.passwordShowTime) !== 1500) out.push(`(lv-textarea-set-password-show-time ${v} ${Math.max(0, Math.round(num(props.passwordShowTime)))})`);
      if (props.oneLine) out.push(`(lv-textarea-set-one-line ${v} t)`);
      out.push(...textProps(v, props, ctx));
      break;
    }
    case 'dropdown': {
      if (props.options) {
        const text = Array.isArray(props.options) ? props.options.join('\n') : String(props.options);
        out.push(`(lv-dropdown-set-options ${v} ${lstr(text)})`);
      }
      if (props.selected !== undefined) out.push(`(lv-dropdown-set-selected ${v} ${num(props.selected)})`);
      if (props.direction) out.push(`(lv-dropdown-set-dir ${v} ${props.direction === 'up' ? 'LV_DIR_TOP' : 'LV_DIR_BOTTOM'})`);
      out.push(...textProps(v, props, ctx));
      break;
    }
    case 'img': {
      const img = findImage(props.src, ctx.imageResources);
      if (img) {
        const pal = ctx.imagePalettes?.[img.id];
        const colors = pal ? ` (list ${pal.map(c => (c === null ? 'nil' : '0x' + c.toString(16).toUpperCase().padStart(6, '0'))).join(' ')})` : '';
        out.push(`(lv-image-set-vesc ${v} ${imageDataSym(img, o)}${colors})`);
      } else if (props.src) {
        out.push(comment(`image "${String(props.src).replace(/\n/g, ' ')}" is not a project resource; add it in Resources`));
      }
      if (img && img.originalName.startsWith('icon_') && ctx.iconColor && !comp.styles.default.imageRecolor) {
        out.push(`(lv-obj-set-style-image-recolor ${v} ${lcolor(ctx.iconColor)} LV_PART_MAIN)`);
        out.push(`(lv-obj-set-style-image-recolor-opa ${v} LV_OPA_COVER LV_PART_MAIN)`);
      }
      const ia: Record<string, string> = {
        stretch: 'STRETCH', contain: 'CONTAIN', cover: 'COVER', center: 'CENTER', tile: 'TILE', top_left: 'TOP_LEFT', default: 'DEFAULT',
      };
      out.push(`(lv-image-set-inner-align ${v} LV_IMAGE_ALIGN_${ia[props.innerAlign] || 'STRETCH'})`);
      if (props.pivotX !== undefined || props.pivotY !== undefined) out.push(`(lv-image-set-pivot ${v} ${Math.round(num(props.pivotX))} ${Math.round(num(props.pivotY))})`);
      if (props.scaleX !== undefined && num(props.scaleX) !== 256) out.push(`(lv-image-set-scale-x ${v} ${Math.max(0, Math.round(num(props.scaleX)))})`);
      if (props.scaleY !== undefined && num(props.scaleY) !== 256) out.push(`(lv-image-set-scale-y ${v} ${Math.max(0, Math.round(num(props.scaleY)))})`);
      if (props.rotation) out.push(`(lv-image-set-rotation ${v} ${Math.round(num(props.rotation) * 10)})`);
      break;
    }
    case 'line': {
      const pts = Array.isArray(props.points) ? props.points : [];
      if (pts.length >= 2) {
        const flat = pts.slice(0, 64).flatMap((p: number[]) => [Math.round(num(p?.[0])), Math.round(num(p?.[1]))]);
        out.push(`(lv-line-set-points ${v} (list ${flat.join(' ')}))`);
      }
      if (props.lineWidth && props.lineWidth !== 2) out.push(`(lv-obj-set-style-line-width ${v} ${num(props.lineWidth)} LV_PART_MAIN)`);
      if (props.lineColor) out.push(`(lv-obj-set-style-line-color ${v} ${lcolor(props.lineColor)} LV_PART_MAIN)`);
      if (props.yInvert === true) out.push(`(lv-line-set-y-invert ${v} t)`);
      if (props.rounded === false) out.push(`(lv-obj-set-style-line-rounded ${v} nil LV_PART_MAIN)`);
      if (num(props.dashWidth) > 0) {
        out.push(`(lv-obj-set-style-line-dash-width ${v} ${Math.round(num(props.dashWidth))} LV_PART_MAIN)`);
        out.push(`(lv-obj-set-style-line-dash-gap ${v} ${Math.round(num(props.dashGap, 4))} LV_PART_MAIN)`);
      }
      break;
    }
    case 'table': {
      if (props.rows !== undefined) out.push(`(lv-table-set-row-count ${v} ${num(props.rows)})`);
      if (props.cols !== undefined) out.push(`(lv-table-set-column-count ${v} ${num(props.cols)})`);
      if (Array.isArray(props.columnWidths)) {
        props.columnWidths.forEach((w: unknown, i: number) => {
          if (w !== undefined) out.push(`(lv-table-set-column-width ${v} ${i} ${num(w)})`);
        });
      }
      if (Array.isArray(props.cellData)) {
        props.cellData.forEach((row: unknown, r: number) => {
          if (!Array.isArray(row)) return;
          row.forEach((cell: unknown, c: number) => {
            if (cell !== undefined && cell !== '') out.push(`(lv-table-set-cell-value ${v} ${r} ${c} ${lstr(String(cell))})`);
          });
        });
      }
      break;
    }
    case 'calendar': {
      if (props.showToday) out.push(`(lv-calendar-set-today-date ${v} ${num(props.year, 2025)} ${num(props.month, 1)} 1)`);
      if (Array.isArray(props.highlightedDates) && props.highlightedDates.length > 0) {
        out.push(comment('highlighted dates are not exposed by the LVGL bridge'));
      }
      break;
    }
    case 'chart': {
      if (props.type) {
        const m: Record<string, string> = { line: 'LV_CHART_TYPE_LINE', bar: 'LV_CHART_TYPE_BAR', scatter: 'LV_CHART_TYPE_SCATTER', curve: 'LV_CHART_TYPE_CURVE', stacked: 'LV_CHART_TYPE_STACKED' };
        out.push(`(lv-chart-set-type ${v} ${m[props.type] || 'LV_CHART_TYPE_LINE'})`);
      }
      if (props.yAxisMin !== undefined || props.yAxisMax !== undefined) {
        out.push(`(lv-chart-set-axis-range ${v} LV_CHART_AXIS_PRIMARY_Y ${num(props.yAxisMin)} ${num(props.yAxisMax, 100)})`);
      }
      if (props.y2AxisMin !== undefined || props.y2AxisMax !== undefined) {
        out.push(`(lv-chart-set-axis-range ${v} LV_CHART_AXIS_SECONDARY_Y ${num(props.y2AxisMin)} ${num(props.y2AxisMax, 100)})`);
      }
      if (props.updateMode === 'circular') out.push(`(lv-chart-set-update-mode ${v} LV_CHART_UPDATE_MODE_CIRCULAR)`);
      const series: Array<{ color?: string; data?: number[]; axis?: string }> =
        Array.isArray(props.series) && props.series.length > 0
          ? props.series
          : Array.isArray(props.data) && props.data.length > 0
            ? [{ color: props.lineColor, data: props.data }]
            : [];
      if (series.length > 0) {
        const dataCount = Math.max(...series.map(s => (Array.isArray(s.data) ? s.data.length : 0)), 1);
        const count = props.pointCount ? Math.max(dataCount, Math.round(num(props.pointCount))) : dataCount;
        out.push(`(lv-chart-set-point-count ${v} ${count})`);
        series.forEach((s, i) => {
          const sv = `${v}${o.namingStyle === 'snake_case' ? '_' : '-'}ser${o.namingStyle === 'snake_case' ? '_' : '-'}${i}`;
          out.push(`(def ${sv} (lv-chart-add-series ${v} ${lcolor(s.color || '#2196F3')} ${s.axis === 'secondary' ? 'LV_CHART_AXIS_SECONDARY_Y' : 'LV_CHART_AXIS_PRIMARY_Y'}))`);
          if (Array.isArray(s.data) && s.data.length > 0) {
            out.push(`(lv-chart-set-series-values ${v} ${sv} (list ${s.data.map(n => num(n)).join(' ')}))`);
          }
        });
      }
      if (props.horDivs !== undefined || props.verDivs !== undefined) {
        out.push(`(lv-chart-set-div-line-count ${v} ${Math.max(0, Math.round(num(props.horDivs, 3)))} ${Math.max(0, Math.round(num(props.verDivs, 5)))})`);
      } else if (props.showGrid === false) out.push(`(lv-chart-set-div-line-count ${v} 0 0)`);
      break;
    }
    case 'spinner': {
      out.push(`(lv-spinner-set-anim-params ${v} ${num(props.speed, 1000)} ${num(props.arcLength, 60)})`);
      break;
    }
    case 'tabview': {
      if (Array.isArray(props.tabs)) {
        out.push(`(lv-tabview-set-tab-bar-position ${v} ${DIR[props.tabPosition] || 'LV_DIR_TOP'})`);
        out.push(`(lv-tabview-set-tab-bar-size ${v} ${num(props.tabBarSize, 50)})`);
        props.tabs.forEach((tab: string, i: number) => {
          out.push(`(def ${sym(o, v, 'tab', i)} (lv-tabview-add-tab ${v} ${lstr(tab)}))`);
        });
      }
      if (props.activeTab !== undefined && props.activeTab > 0) {
        out.push(`(lv-tabview-set-active ${v} ${num(props.activeTab)} LV_ANIM_OFF)`);
      }
      break;
    }
    case 'tileview': {
      if (props.rows !== undefined && props.cols !== undefined) {
        for (let r = 0; r < props.rows; r++) {
          for (let c = 0; c < props.cols; c++) {
            out.push(`(def ${sym(o, v, 'tile', r, c)} (lv-tileview-add-tile ${v} ${c} ${r} LV_DIR_ALL))`);
          }
        }
        if (props.currentRow || props.currentCol) {
          out.push(`(lv-tileview-set-tile ${v} ${sym(o, v, 'tile', num(props.currentRow), num(props.currentCol))} LV_ANIM_OFF)`);
        }
      }
      break;
    }
    case 'win': {
      if (props.title) out.push(`(lv-win-add-title ${v} ${lstr(props.title)})`);
      const header = `${v}${o.namingStyle === 'snake_case' ? '_' : '-'}header`;
      const btns: Array<{ icon: string; width: number }> = [];
      if (props.showCloseBtn !== false) btns.push({ icon: 'LV_SYMBOL_CLOSE', width: 40 });
      if (Array.isArray(props.headerButtons)) {
        for (const b of props.headerButtons) btns.push({ icon: b.icon || 'LV_SYMBOL_SETTINGS', width: b.width || 40 });
      }
      if ((props.headerHeight && props.headerHeight !== 40) || btns.length > 0) {
        out.push(`(def ${header} (lv-win-get-header ${v}))`);
      }
      if (props.headerHeight && props.headerHeight !== 40) out.push(`(lv-obj-set-height ${header} ${num(props.headerHeight)})`);
      btns.forEach((b, i) => {
        const bv = sym(o, v, 'hbtn', i);
        out.push(`(def ${bv} (lv-button-create ${header}))`);
        out.push(`(lv-obj-set-width ${bv} ${b.width})`);
        out.push(`(def ${bv}${o.namingStyle === 'snake_case' ? '_' : '-'}label (lv-label-create ${bv}))`);
        out.push(`(lv-label-set-text ${bv}${o.namingStyle === 'snake_case' ? '_' : '-'}label ${lstr(symbolText(b.icon))})`);
        out.push(`(lv-obj-center ${bv}${o.namingStyle === 'snake_case' ? '_' : '-'}label)`);
      });
      break;
    }
    case 'obj': {
      if (props.scrollDir) {
        const m: Record<string, string> = { none: 'LV_DIR_NONE', hor: 'LV_DIR_HOR', ver: 'LV_DIR_VER', all: 'LV_DIR_ALL' };
        out.push(`(lv-obj-set-scroll-dir ${v} ${m[props.scrollDir] || 'LV_DIR_NONE'})`);
      }
      if (props.layout === 'flex') {
        out.push(`(lv-obj-set-layout ${v} LV_LAYOUT_FLEX)`);
        const dir = props.flexDirection || 'row';
        const wrap = props.flexWrap === true || props.flexWrap === 'wrap';
        const flow: Record<string, string> = {
          row: wrap ? 'LV_FLEX_FLOW_ROW_WRAP' : 'LV_FLEX_FLOW_ROW',
          column: wrap ? 'LV_FLEX_FLOW_COLUMN_WRAP' : 'LV_FLEX_FLOW_COLUMN',
          'row-reverse': wrap ? 'LV_FLEX_FLOW_ROW_WRAP_REVERSE' : 'LV_FLEX_FLOW_ROW_REVERSE',
          'column-reverse': wrap ? 'LV_FLEX_FLOW_COLUMN_WRAP_REVERSE' : 'LV_FLEX_FLOW_COLUMN_REVERSE',
        };
        out.push(`(lv-obj-set-flex-flow ${v} ${flow[dir] || 'LV_FLEX_FLOW_ROW'})`);
        if (props.justifyContent || props.alignItems || props.alignContent) {
          const main: Record<string, string> = {
            'flex-start': 'LV_FLEX_ALIGN_START', 'flex-end': 'LV_FLEX_ALIGN_END', center: 'LV_FLEX_ALIGN_CENTER',
            'space-between': 'LV_FLEX_ALIGN_SPACE_BETWEEN', 'space-around': 'LV_FLEX_ALIGN_SPACE_AROUND', 'space-evenly': 'LV_FLEX_ALIGN_SPACE_EVENLY',
          };
          const cross: Record<string, string> = {
            'flex-start': 'LV_FLEX_ALIGN_START', 'flex-end': 'LV_FLEX_ALIGN_END', center: 'LV_FLEX_ALIGN_CENTER', stretch: 'LV_FLEX_ALIGN_START',
          };
          out.push(`(lv-obj-set-flex-align ${v} ${main[props.justifyContent] || 'LV_FLEX_ALIGN_START'} ${cross[props.alignItems] || 'LV_FLEX_ALIGN_START'} ${cross[props.alignContent] || 'LV_FLEX_ALIGN_START'})`);
        }
        const gap = num(props.gap);
        out.push(`(lv-obj-set-style-pad-row ${v} ${gap} LV_PART_MAIN)`);
        out.push(`(lv-obj-set-style-pad-column ${v} ${gap} LV_PART_MAIN)`);
      } else if (props.layout === 'grid') {
        out.push(comment('grid track descriptors are not exposed by the LVGL bridge: children keep their absolute positions'));
        out.push(`(lv-obj-set-style-pad-column ${v} ${num(props.gridColumnGap)} LV_PART_MAIN)`);
        out.push(`(lv-obj-set-style-pad-row ${v} ${num(props.gridRowGap)} LV_PART_MAIN)`);
      }
      break;
    }
  }

  out.push(...extraPropsForms(comp, v, o, ctx.names));
  if (props.flexGrow !== undefined && props.flexGrow > 0) out.push(`(lv-obj-set-flex-grow ${v} ${num(props.flexGrow)})`);
  return out;
}

function animForms(v: string, anims: Animation[], ctx: UiContext): string[] {
  const out: string[] = [];
  for (const a of anims) {
    if (ctx.options.generateComments) out.push(comment(`Animation: ${a.name || a.type}`));
    const prop = sym({ namingStyle: 'kebab-case' }, a.property);
    const ease = sym({ namingStyle: 'kebab-case' }, a.easing || 'linear');
    out.push(`(ui-anim-add ${v} '${prop} ${Math.round(a.startValue)} ${Math.round(a.endValue)} ${Math.round(a.duration)} ${Math.round(a.delay || 0)} '${ease} ${Math.max(1, Math.round(a.repeat || 1))})`);
  }
  return out;
}

const ALIGN: Record<string, string> = {
  center: 'LV_ALIGN_CENTER', top_left: 'LV_ALIGN_TOP_LEFT', top_mid: 'LV_ALIGN_TOP_MID', top_right: 'LV_ALIGN_TOP_RIGHT',
  bottom_left: 'LV_ALIGN_BOTTOM_LEFT', bottom_mid: 'LV_ALIGN_BOTTOM_MID', bottom_right: 'LV_ALIGN_BOTTOM_RIGHT',
  left_mid: 'LV_ALIGN_LEFT_MID', right_mid: 'LV_ALIGN_RIGHT_MID',
};

/** Forms (one per line, no indentation) that build `comp` and its subtree under `parent`. */
function componentForms(comp: LvglComponent, parent: string, pageName: string, ctx: UiContext): string[] {
  const o = ctx.options;
  const v = ctx.names.varOf(comp);
  const out: string[] = [];
  if (o.generateComments) out.push(comment(`Create ${comp.type}: ${comp.name}`));

  out.push(`(def ${v} (${CREATE_FN[comp.type] || EXTRA_CREATE_FN[comp.type] || 'lv-obj-create'} ${parent}))`);
  // keyboard and message box come centred / bottom-aligned from LVGL: pin them to the top left like every other widget
  if (comp.type === 'keyboard' || comp.type === 'msgbox') out.push(`(lv-obj-set-align ${v} LV_ALIGN_TOP_LEFT)`);
  out.push(`(lv-obj-set-pos ${v} ${Math.round(comp.x)} ${Math.round(comp.y)})`);

  const w = comp.widthMode === 'content' ? 'LV_SIZE_CONTENT' : comp.widthMode === 'percent' ? `(lv-pct ${comp.width})` : String(Math.round(comp.width));
  const h = comp.heightMode === 'content' ? 'LV_SIZE_CONTENT' : comp.heightMode === 'percent' ? `(lv-pct ${comp.height})` : String(Math.round(comp.height));
  if (w === String(Math.round(comp.width)) && h === String(Math.round(comp.height))) {
    out.push(`(lv-obj-set-size ${v} ${w} ${h})`);
  } else {
    out.push(`(lv-obj-set-width ${v} ${w})`);
    out.push(`(lv-obj-set-height ${v} ${h})`);
  }

  if (comp.align && comp.align !== 'default' && ALIGN[comp.align]) {
    out.push(`(lv-obj-align ${v} ${ALIGN[comp.align]} ${comp.alignOffsetX || 0} ${comp.alignOffsetY || 0})`);
  }

  const f = comp.flags;
  if (f) {
    if (f.hidden) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_HIDDEN)`);
    if (f.disabled) out.push(`(lv-obj-add-state ${v} LV_STATE_DISABLED)`);
    if (f.clickable === false) out.push(`(lv-obj-remove-flag ${v} LV_OBJ_FLAG_CLICKABLE)`);
    if (f.checkable) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_CHECKABLE)`);
    if (f.scrollable === false) out.push(`(lv-obj-remove-flag ${v} LV_OBJ_FLAG_SCROLLABLE)`);
    if (f.scrollElastic === false) out.push(`(lv-obj-remove-flag ${v} LV_OBJ_FLAG_SCROLL_ELASTIC)`);
    if (f.scrollMomentum === false) out.push(`(lv-obj-remove-flag ${v} LV_OBJ_FLAG_SCROLL_MOMENTUM)`);
    if (f.scrollOnFocus === false) out.push(`(lv-obj-remove-flag ${v} LV_OBJ_FLAG_SCROLL_ON_FOCUS)`);
    if (f.snappable) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_SNAPPABLE)`);
    if (f.pressLock) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_PRESS_LOCK)`);
    if (f.eventBubble) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_EVENT_BUBBLE)`);
    if (f.gesturesBubble) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_GESTURE_BUBBLE)`);
    if (f.clickFocusable === false) out.push(`(lv-obj-remove-flag ${v} LV_OBJ_FLAG_CLICK_FOCUSABLE)`);
    const extra: Array<[boolean | undefined, string]> = [
      [f.scrollOne, 'SCROLL_ONE'], [f.scrollChainHor, 'SCROLL_CHAIN_HOR'], [f.scrollChainVer, 'SCROLL_CHAIN_VER'],
      [f.scrollWithArrow, 'SCROLL_WITH_ARROW'], [f.eventTrickle, 'EVENT_TRICKLE'], [f.stateTrickle, 'STATE_TRICKLE'],
      [f.advHittest, 'ADV_HITTEST'], [f.floating, 'FLOATING'], [f.ignoreLayout, 'IGNORE_LAYOUT'],
      [f.overflowVisible, 'OVERFLOW_VISIBLE'], [f.flexInNewTrack, 'FLEX_IN_NEW_TRACK'],
    ];
    for (const [on, name] of extra) if (on) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_${name})`);
  }

  const sb = comp.styles.default.scrollbarMode;
  if (sb && sb !== 'auto') {
    const m: Record<string, string> = { off: 'LV_SCROLLBAR_MODE_OFF', on: 'LV_SCROLLBAR_MODE_ON', active: 'LV_SCROLLBAR_MODE_ACTIVE' };
    if (m[sb]) out.push(`(lv-obj-set-scrollbar-mode ${v} ${m[sb]})`);
  }

  const arcLike = isArcLike(comp.type);
  // arcs and spinners have no box border: their border style only ever described the arc
  const defaultStyle = arcLike ? { ...comp.styles.default, borderWidth: 0, borderColor: undefined, borderRadius: undefined } : comp.styles.default;
  out.push(...styleForms(v, defaultStyle, 'LV_PART_MAIN', ctx));
  if (arcLike) {
    const arc = getArcStyle(comp);
    out.push(`(lv-obj-set-style-arc-width ${v} ${arc.width} LV_PART_MAIN)`);
    out.push(`(lv-obj-set-style-arc-color ${v} ${lcolor(arc.track)} LV_PART_MAIN)`);
    out.push(`(lv-obj-set-style-arc-width ${v} ${arc.width} LV_PART_INDICATOR)`);
    out.push(`(lv-obj-set-style-arc-color ${v} ${lcolor(arc.color)} LV_PART_INDICATOR)`);
  }
  for (const [key, st] of Object.entries(comp.styles)) {
    const sel = styleSelector(key);
    if (st && sel) out.push(...styleForms(v, st, sel, ctx));
  }

  out.push(...propsForms(comp, v, ctx));

  for (const ev of comp.events) {
    // screen events are only sent to screen objects: register them on the screen the component is on
    const evTarget = ev.eventType.startsWith('LV_EVENT_SCREEN_') ? ctx.names.screenVar(pageName) : v;
    out.push(`(lv-obj-add-event-cb ${evTarget} '${ctx.names.eventHandler(comp, ev)} ${ev.eventType})`);
  }

  out.push(...animForms(v, comp.animations || [], ctx));
  if (!comp.visible) out.push(`(lv-obj-add-flag ${v} LV_OBJ_FLAG_HIDDEN)`);
  out.push('');

  // children
  const sep = o.namingStyle === 'snake_case' ? '_' : '-';
  if (comp.type === 'tabview' && Array.isArray(comp.props?.tabs) && comp.props.tabs.length > 0) {
    const map: Record<string, string[]> = comp.props.tabChildMap || {};
    const childTab: Record<string, string> = {};
    for (const [idx, ids] of Object.entries(map)) {
      if (Array.isArray(ids)) for (const id of ids) childTab[id] = sym(o, v, 'tab', Number(idx));
    }
    const fallback = sym(o, v, 'tab', comp.props.activeTab || 0);
    for (const c of comp.children) out.push(...componentForms(c, childTab[c.id] || fallback, pageName, ctx));
  } else if (comp.type === 'tileview' && comp.props?.rows !== undefined && comp.props?.cols !== undefined) {
    const map: Record<string, string[]> = comp.props.tileChildMap || {};
    const childTile: Record<string, string> = {};
    for (const [key, ids] of Object.entries(map)) {
      const [r, c] = key.split('-');
      if (Array.isArray(ids)) for (const id of ids) childTile[id] = sym(o, v, 'tile', Number(r), Number(c));
    }
    const fallback = sym(o, v, 'tile', 0, 0);
    for (const c of comp.children) out.push(...componentForms(c, childTile[c.id] || fallback, pageName, ctx));
  } else if (comp.type === 'win') {
    if (comp.children.length > 0) {
      const content = `${v}${sep}content`;
      out.push(`(def ${content} (lv-win-get-content ${v}))`);
      for (const c of comp.children) out.push(...componentForms(c, content, pageName, ctx));
    }
  } else {
    for (const c of comp.children) out.push(...componentForms(c, v, pageName, ctx));
  }
  return out;
}

// ---------------------------------------------------------------- file

const ANIM_RUNTIME = `(def ui-anims nil)

(defun ui-anim-add (obj prop from to dur delay ease plays)
  (setq ui-anims (cons (list obj prop from to dur delay ease plays (systime)) ui-anims)))

(defun ui-bounce (k)
  (cond
    ((< k 0.363636) (* 7.5625 k k))
    ((< k 0.727272) (let ((u (- k 0.545454))) (+ (* 7.5625 u u) 0.75)))
    ((< k 0.909090) (let ((u (- k 0.818181))) (+ (* 7.5625 u u) 0.9375)))
    (t (let ((u (- k 0.954545))) (+ (* 7.5625 u u) 0.984375)))))

(defun ui-ease (kind k)
  (cond
    ((eq kind 'ease-in) (* k k))
    ((eq kind 'ease-out) (- 1.0 (* (- 1.0 k) (- 1.0 k))))
    ((eq kind 'ease-in-out) (if (< k 0.5) (* 2.0 k k) (- 1.0 (* 2.0 (- 1.0 k) (- 1.0 k)))))
    ((eq kind 'overshoot) (let ((u (- k 1.0))) (+ 1.0 (* 2.70158 u u u) (* 1.70158 u u))))
    ((eq kind 'bounce) (ui-bounce k))
    (t k)))

;; zoom / rotation work on any widget (not only images) and turn around the centre
(defun ui-pivot (obj)
  (progn
    (lv-obj-set-style-transform-pivot-x obj (/ (lv-obj-get-width obj) 2) LV_PART_MAIN)
    (lv-obj-set-style-transform-pivot-y obj (/ (lv-obj-get-height obj) 2) LV_PART_MAIN)))

(defun ui-anim-set (obj prop v)
  (cond
    ((eq prop 'x) (lv-obj-set-x obj v))
    ((eq prop 'y) (lv-obj-set-y obj v))
    ((eq prop 'width) (lv-obj-set-width obj v))
    ((eq prop 'height) (lv-obj-set-height obj v))
    ((eq prop 'opa) (lv-obj-set-style-opa obj v LV_PART_MAIN))
    ((eq prop 'transform-zoom) (progn (ui-pivot obj) (lv-obj-set-style-transform-scale-x obj v LV_PART_MAIN) (lv-obj-set-style-transform-scale-y obj v LV_PART_MAIN)))
    ((eq prop 'transform-angle) (progn (ui-pivot obj) (lv-obj-set-style-transform-rotation obj v LV_PART_MAIN)))
    (t nil)))

;; one animation step: returns the updated record, or nil when finished
(defun ui-anim-tick (a)
  (let ((obj (ix a 0)) (prop (ix a 1)) (from (ix a 2)) (to (ix a 3))
        (dur (ix a 4)) (delay (ix a 5)) (ease (ix a 6)) (plays (ix a 7)) (t0 (ix a 8)))
    (let ((el (- (* 1000.0 (secs-since t0)) delay)))
      (cond
        ((< el 0.0) a)
        ((>= el dur)
         (progn
           (ui-anim-set obj prop to)
           (if (> plays 1) (list obj prop from to dur 0 ease (- plays 1) (systime)) nil)))
        (t (progn
             (ui-anim-set obj prop (+ from (to-i (* (- to from) (ui-ease ease (/ el dur))))))
             a))))))

;; call this regularly from the main loop
(defun ui-anim-step ()
  (if ui-anims
      ;; a failing animation (e.g. its widget was deleted) is dropped instead of stopping all the others
      (setq ui-anims (filter (lambda (a) a)
                             (map (lambda (a) (let ((r (trap (ui-anim-tick a)))) (if (eq (car r) 'exit-error) nil r))) ui-anims)))))`;

export function hasAnimations(pages: Page[]): boolean {
  const walk = (cs: LvglComponent[]): boolean => cs.some(c => (c.animations && c.animations.length > 0) || walk(c.children));
  return pages.some(p => walk(p.components));
}

function defun(name: string, params: string, body: string[], options: LispGenOptions): string[] {
  const i = indent(options);
  return [`(defun ${name} (${params})`, `${i}(progn`, ...shift(body, options.indentSize * 2), `${i}${i}nil))`];
}

export function generateUiLisp(pages: Page[], ctx: UiContext, theme?: Theme): string {
  const o = ctx.options;
  if (theme) ctx.iconColor = theme.colors.text;
  const L: string[] = [];
  L.push(...banner('ui.lisp - screens and widgets (generated by LVGL UI Editor)'));
  L.push(comment('Needs the LVGL bridge of the P4 Dashboard firmware (lv-* functions).'));
  if (theme && o.generateComments) {
    L.push(comment(`Project theme "${theme.name}": applied with (lv-theme-set primary secondary dark) in ui-init.`));
  }
  L.push('');

  if (hasAnimations(pages)) {
    if (o.generateComments) L.push(...banner('Animation runtime'));
    L.push(ANIM_RUNTIME);
  } else {
    L.push(comment('no animations in this project'));
    L.push('(defun ui-anim-step () nil)');
  }
  L.push('');

  // fonts
  const fonts = collectUsedCustomFonts(pages, ctx.fontResources, ctx.defaultFont, ctx.defaultFontSize);
  const fontBody: string[] = [];
  for (const [name, sizes] of fonts) {
    for (const s of [...sizes].sort((a, b) => a - b)) {
      fontBody.push(`(def ${fontSym(name, s, o)} (lv-font-load ${fontDataSym(name, s, o)}))`);
    }
  }
  if (o.generateComments) L.push(...banner('Fonts'));
  L.push(...defun('ui-fonts-init', '', fontBody, o), '');

  // defaults
  let defaultFontSetter: string | undefined;
  if (ctx.defaultFont && ctx.defaultFont !== 'montserrat_14') {
    const m = /^montserrat_(\d+)$/.exec(ctx.defaultFont);
    defaultFontSetter = m ? `font-montserrat-${m[1]}` : fontSym(ctx.defaultFont, ctx.defaultFontSize || 16, o);
  }

  if (o.generateComments) L.push(...banner('Screens'));
  for (const page of pages) {
    const sv = ctx.names.screenVar(page.name);
    const body: string[] = [];
    if (o.generateComments) body.push(comment(`Create screen: ${page.name}`));
    body.push(`(def ${sv} (lv-obj-create nil))`);
    if (page.backgroundColor) body.push(`(lv-obj-set-style-bg-color ${sv} ${lcolor(page.backgroundColor)} LV_PART_MAIN)`);
    if (defaultFontSetter) body.push(`(lv-obj-set-style-text-font ${sv} ${defaultFontSetter} LV_PART_MAIN)`);
    body.push('');
    for (const c of page.components) body.push(...componentForms(c, sv, page.name, ctx));
    body.push(...userCode(`${page.name}_init`, o));
    L.push(...defun(ctx.names.initFn(page.name), '', body, o), '');
  }

  if (o.generateComments) L.push(...banner('Screen loading'));
  for (const page of pages) {
    L.push(`(defun ${ctx.names.loadFn(page.name)} ()`);
    L.push(`${indent(o)}(lv-screen-load-anim ${ctx.names.screenVar(page.name)} LV_SCREEN_LOAD_ANIM_FADE_ON 300 0 nil))`, '');
    L.push(`(defun ${ctx.names.loadFn(page.name)}${o.namingStyle === 'snake_case' ? '_anim' : '-anim'} (anim ms)`);
    L.push(`${indent(o)}(lv-screen-load-anim ${ctx.names.screenVar(page.name)} anim ms 0 nil))`, '');
  }

  if (o.generateComments) L.push(...banner('Main init'));
  const initBody: string[] = [];
  if (theme) initBody.push(`(lv-theme-set ${lcolor(theme.colors.primary)} ${lcolor(theme.colors.secondary)} ${isDarkTheme(theme) ? 't' : 'nil'})`);
  initBody.push('(ui-fonts-init)');
  for (const page of pages) initBody.push(`(${ctx.names.initFn(page.name)})`);
  if (pages.length > 0) initBody.push(`(${ctx.names.loadFn(pages[0].name)})`);
  initBody.push(...userCode('ui_init', o));
  L.push(...defun('ui-init', '', initBody, o), '');
  return L.join('\n') + '\n';
}
