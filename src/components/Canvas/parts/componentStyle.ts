import React from 'react';
import { isArcLike } from '../../../utils/arcStyle';
import type { LvglComponent, ThemeColors } from '../../../types';

export interface ComponentStyleArgs {
  component: LvglComponent;
  th: ThemeColors;
  tint: string;
  muted: string;
  parentWidth?: number;
  parentHeight?: number;
  parentLayout?: string;
  parentFlexDirection?: string;
  defaultFontSize: number;
}

/** Inline CSS of a canvas component (box, background, border, transform, layout child props) built from its LVGL style. */
export function buildComponentStyle({ component, th, parentWidth, parentHeight, parentLayout }: ComponentStyleArgs) {
  const { type } = component;
  const defaultStyle = component.styles.default;
  // Helper: apply shadow opacity to shadow color
  const buildShadowColor = (color?: string, opacity?: number): string => {
    if (!color) return 'rgba(0,0,0,0.3)';
    if (opacity === undefined || opacity === null) return color;
    // Parse hex color and apply alpha
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, opacity / 255))})`;
  };

  // Build box-shadow from shadow properties
  const buildBoxShadow = (): string | undefined => {
    if (!defaultStyle.shadowWidth && !defaultStyle.shadowOffsetX && !defaultStyle.shadowOffsetY) return undefined;
    const offX = defaultStyle.shadowOffsetX || 0;
    const offY = defaultStyle.shadowOffsetY || 0;
    const blur = defaultStyle.shadowWidth || 0;
    const spread = defaultStyle.shadowSpread || 0;
    const color = buildShadowColor(defaultStyle.shadowColor, defaultStyle.shadowOpacity);
    return `${offX}px ${offY}px ${blur}px ${spread}px ${color}`;
  };

  // Build transform from transform properties
  const buildTransform = (): string | undefined => {
    const parts: string[] = [];
    if (defaultStyle.transformAngle) {
      // LVGL uses 0.1 degree units
      parts.push(`rotate(${defaultStyle.transformAngle / 10}deg)`);
    }
    if (defaultStyle.transformZoomX !== undefined || defaultStyle.transformZoomY !== undefined) {
      // LVGL 256 = 100%
      const sx = defaultStyle.transformZoomX !== undefined ? defaultStyle.transformZoomX / 256 : 1;
      const sy = defaultStyle.transformZoomY !== undefined ? defaultStyle.transformZoomY / 256 : 1;
      parts.push(`scaleX(${sx}) scaleY(${sy})`);
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  };

  // Build transform-origin from pivot properties
  const buildTransformOrigin = (): string | undefined => {
    if (defaultStyle.transformPivotX !== undefined || defaultStyle.transformPivotY !== undefined) {
      const px = defaultStyle.transformPivotX ?? component.width / 2;
      const py = defaultStyle.transformPivotY ?? component.height / 2;
      return `${px}px ${py}px`;
    }
    return undefined;
  };

  // Build background with gradient support
  const buildBackground = (): string | undefined => {
    if (defaultStyle.bgGradDir && defaultStyle.bgGradDir !== 'none' && defaultStyle.bgGradColor) {
      const baseColor = defaultStyle.bgColor || '#e0e0e0';
      const gradColor = defaultStyle.bgGradColor;
      const stop = defaultStyle.bgGradStop !== undefined ? Math.round((defaultStyle.bgGradStop / 255) * 100) : 100;
      const dir = defaultStyle.bgGradDir === 'hor' ? 'to right' : 'to bottom';
      return `linear-gradient(${dir}, ${baseColor} 0%, ${gradColor} ${stop}%)`;
    }
    return undefined;
  };

  // Build outline
  const buildOutline = (): React.CSSProperties => {
    const result: React.CSSProperties = {};
    if (defaultStyle.outlineWidth) {
      result.outline = `${defaultStyle.outlineWidth}px solid ${defaultStyle.outlineColor || '#000'}`;
      if (defaultStyle.outlinePad !== undefined) {
        result.outlineOffset = `${defaultStyle.outlinePad}px`;
      }
    }
    return result;
  };

  // Build border styles with borderSide support
  const buildBorderStyles = (): React.CSSProperties => {
    // arcs and spinners are drawn by their arc, not by a box border
    if (isArcLike(type)) return { borderStyle: 'none' };
    const bw = defaultStyle.borderWidth;
    const bc = defaultStyle.borderColor;
    const side = defaultStyle.borderSide || 'full';

    if (!bw) return { borderStyle: 'none' };

    const borderVal = `${bw}px solid ${bc || '#ccc'}`;
    const noBorder = 'none';

    switch (side) {
      case 'top':
        return { borderTop: borderVal, borderBottom: noBorder, borderLeft: noBorder, borderRight: noBorder };
      case 'bottom':
        return { borderTop: noBorder, borderBottom: borderVal, borderLeft: noBorder, borderRight: noBorder };
      case 'left':
        return { borderTop: noBorder, borderBottom: noBorder, borderLeft: borderVal, borderRight: noBorder };
      case 'right':
        return { borderTop: noBorder, borderBottom: noBorder, borderLeft: noBorder, borderRight: borderVal };
      case 'top_bottom':
        return { borderTop: borderVal, borderBottom: borderVal, borderLeft: noBorder, borderRight: noBorder };
      case 'left_right':
        return { borderTop: noBorder, borderBottom: noBorder, borderLeft: borderVal, borderRight: borderVal };
      case 'none':
        return { borderStyle: 'none' };
      default: // 'full'
        return { borderColor: bc, borderWidth: bw, borderStyle: 'solid' };
    }
  };

  // Build padding with four-direction support
  const buildPadding = (): React.CSSProperties => {
    const result: React.CSSProperties = {};
    const base = defaultStyle.padding;
    if (base !== undefined) result.padding = base;
    if (defaultStyle.paddingTop !== undefined) result.paddingTop = defaultStyle.paddingTop;
    if (defaultStyle.paddingBottom !== undefined) result.paddingBottom = defaultStyle.paddingBottom;
    if (defaultStyle.paddingLeft !== undefined) result.paddingLeft = defaultStyle.paddingLeft;
    if (defaultStyle.paddingRight !== undefined) result.paddingRight = defaultStyle.paddingRight;
    return result;
  };

  // Build border-radius with four-corner support
  const buildBorderRadius = (): string | number | undefined => {
    if (
      defaultStyle.borderRadiusTopLeft !== undefined ||
      defaultStyle.borderRadiusTopRight !== undefined ||
      defaultStyle.borderRadiusBottomLeft !== undefined ||
      defaultStyle.borderRadiusBottomRight !== undefined
    ) {
      const tl = defaultStyle.borderRadiusTopLeft ?? defaultStyle.borderRadius ?? 0;
      const tr = defaultStyle.borderRadiusTopRight ?? defaultStyle.borderRadius ?? 0;
      const br = defaultStyle.borderRadiusBottomRight ?? defaultStyle.borderRadius ?? 0;
      const bl = defaultStyle.borderRadiusBottomLeft ?? defaultStyle.borderRadius ?? 0;
      return `${tl}px ${tr}px ${br}px ${bl}px`;
    }
    return defaultStyle.borderRadius;
  };

  // Build blend mode
  const buildMixBlendMode = (): React.CSSProperties['mixBlendMode'] => {
    switch (defaultStyle.blendMode) {
      case 'additive': return 'screen';
      case 'subtractive': return 'difference';
      case 'multiply': return 'multiply';
      default: return undefined; // 'normal' is default, no need to set
    }
  };

  // Build text-decoration
  const buildTextDecoration = (): string | undefined => {
    switch (defaultStyle.textDecor) {
      case 'underline': return 'underline';
      case 'strikethrough': return 'line-through';
      default: return undefined;
    }
  };

  // Build width/height with mode support
  const buildDimension = (value: number, mode?: string): string | number => {
    switch (mode) {
      case 'percent': return `${value}%`;
      case 'content': return 'fit-content';
      default: return value;
    }
  };

  const background = buildBackground();
  const outlineStyles = buildOutline();
  const borderStyles = buildBorderStyles();
  const paddingStyles = buildPadding();

  // Resolve effective background color: ensure components are never accidentally invisible
  // in the design canvas. Components with transparent bg are correct for LVGL, but need
  // a visible fallback in the designer so users can see and interact with them.
  const resolvedBgColor = (() => {
    const bg = defaultStyle.bgColor;
    const isMissing = !bg || bg === '';
    const isTransparent = bg?.toLowerCase() === 'transparent';

    if (isMissing || isTransparent) {
      switch (type) {
        case 'btn': return th.primary;
        case 'obj': return th.surface;
        case 'textarea': return th.surface;
        case 'dropdown': return th.surface;
        case 'img': return th.surface;
        case 'table': return th.surface;
        case 'chart': return th.surface;
        case 'calendar': return th.surface;
        case 'tabview': return th.surface;
        case 'tileview': return th.surface;
        case 'win': return th.surface;
        // These types are legitimately transparent — keep them that way
        case 'label': return 'transparent';
        case 'arc': return 'transparent';
        case 'spinner': return 'transparent';
        case 'checkbox': return 'transparent';
        default: return bg || 'transparent';
      }
    }
    return bg;
  })();

  // Calculate visual position based on align property
  // When align is set, the component's position is relative to the alignment anchor point
  // within the parent. x/y become offsets from that anchor (like LVGL's lv_obj_align).
  const computeAlignedPosition = (): { left: number; top: number } => {
    const align = component.align;
    if (!align || align === 'default') {
      return { left: component.x, top: component.y };
    }

    const pw = parentWidth ?? 0;
    const ph = parentHeight ?? 0;
    const cw = component.width;
    const ch = component.height;
    // In LVGL, after lv_obj_align, x/y are offsets from the align point.
    // alignOffsetX/Y are additional offsets on top of that.
    const offX = (component.alignOffsetX || 0) + component.x;
    const offY = (component.alignOffsetY || 0) + component.y;

    switch (align) {
      case 'center':
        return { left: (pw - cw) / 2 + offX, top: (ph - ch) / 2 + offY };
      case 'top_left':
        return { left: offX, top: offY };
      case 'top_mid':
        return { left: (pw - cw) / 2 + offX, top: offY };
      case 'top_right':
        return { left: pw - cw + offX, top: offY };
      case 'bottom_left':
        return { left: offX, top: ph - ch + offY };
      case 'bottom_mid':
        return { left: (pw - cw) / 2 + offX, top: ph - ch + offY };
      case 'bottom_right':
        return { left: pw - cw + offX, top: ph - ch + offY };
      case 'left_mid':
        return { left: offX, top: (ph - ch) / 2 + offY };
      case 'right_mid':
        return { left: pw - cw + offX, top: (ph - ch) / 2 + offY };
      default:
        return { left: component.x, top: component.y };
    }
  };

  const alignedPos = computeAlignedPosition();

  // Determine if this component is inside a layout container (flex/grid)
  const isInLayout = parentLayout === 'flex' || parentLayout === 'grid';

  // Build inline styles from component styles
  const componentStyle: React.CSSProperties = {
    position: isInLayout ? 'relative' : 'absolute',
    ...(isInLayout ? {} : { left: alignedPos.left, top: alignedPos.top }),
    width: buildDimension(component.width, (component as unknown as Record<string, unknown>).widthMode as string | undefined),
    height: buildDimension(component.height, (component as unknown as Record<string, unknown>).heightMode as string | undefined),
    backgroundColor: background ? undefined : resolvedBgColor,
    ...(background ? { background } : {}),
    ...borderStyles,
    borderRadius: buildBorderRadius(),
    color: defaultStyle.textColor,
    opacity: component.visible === false ? 0.3 : (defaultStyle.opacity !== undefined ? defaultStyle.opacity : 1),
    ...paddingStyles,
    boxSizing: 'border-box',
    pointerEvents: component.visible === false ? 'none' : undefined,
    // Shadow
    boxShadow: buildBoxShadow(),
    // Transform
    transform: buildTransform(),
    transformOrigin: buildTransformOrigin(),
    // Outline
    ...outlineStyles,
    // Blend mode
    mixBlendMode: buildMixBlendMode(),
    // Text decoration
    textDecoration: buildTextDecoration(),
    // Size limits, margins and per-part opacity
    minWidth: defaultStyle.minWidth, maxWidth: defaultStyle.maxWidth, minHeight: defaultStyle.minHeight, maxHeight: defaultStyle.maxHeight,
    ...(defaultStyle.marginTop !== undefined ? { marginTop: defaultStyle.marginTop } : {}),
    ...(defaultStyle.marginBottom !== undefined ? { marginBottom: defaultStyle.marginBottom } : {}),
    ...(defaultStyle.marginLeft !== undefined ? { marginLeft: defaultStyle.marginLeft } : {}),
    ...(defaultStyle.marginRight !== undefined ? { marginRight: defaultStyle.marginRight } : {}),
    ...(defaultStyle.clipCorner ? { overflow: 'hidden' } : {}),
    ...(defaultStyle.blurRadius ? { backdropFilter: `blur(${defaultStyle.blurRadius}px)` } : {}),
    ...(defaultStyle.textOpa !== undefined && defaultStyle.textColor ? { color: `color-mix(in srgb, ${defaultStyle.textColor} ${Math.round((defaultStyle.textOpa / 255) * 100)}%, transparent)` } : {}),
    // Flex child properties when inside a flex container
    ...(parentLayout === 'flex' ? {
      flexGrow: component.props.flexGrow ?? undefined,
      flexShrink: component.props.flexShrink ?? undefined,
      alignSelf: component.props.alignSelf && component.props.alignSelf !== 'auto' ? component.props.alignSelf : undefined,
    } : {}),
    // Grid child properties when inside a grid container
    ...(parentLayout === 'grid' ? {
      gridColumn: component.props.gridColumnSpan && component.props.gridColumnSpan > 1
        ? `${(component.props.gridColumn ?? 0) + 1} / span ${component.props.gridColumnSpan}`
        : (component.props.gridColumn !== undefined ? `${component.props.gridColumn + 1}` : undefined),
      gridRow: component.props.gridRowSpan && component.props.gridRowSpan > 1
        ? `${(component.props.gridRow ?? 0) + 1} / span ${component.props.gridRowSpan}`
        : (component.props.gridRow !== undefined ? `${component.props.gridRow + 1}` : undefined),
    } : {}),
  };

  return { componentStyle, resolvedBgColor, background, borderStyles, paddingStyles, outlineStyles };
}
