import { Image as ImageIcon } from 'lucide-react';
import { getArcStyle, isArcLike } from '../../utils/arcStyle';
import React, { useCallback, useRef, useState } from 'react';
import type { LvglComponent, ResizeHandle } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { useAppStore } from '../../store/appStore';
import { useResourceStore } from '../../resources/resourceStore';
import { useThemeStore } from '../../store/themeStore';
import { t } from '../../i18n';
import './CanvasComponent.css';

interface CanvasComponentProps {
  component: LvglComponent;
  offsetX?: number;
  offsetY?: number;
  parentWidth?: number;
  parentHeight?: number;
  parentLayout?: string; // 'flex' | 'grid' | 'none' — parent container's layout mode
  parentFlexDirection?: string; // parent's flexDirection when parentLayout='flex'
  onClick: (e: React.MouseEvent, id: string) => void;
  onDragStart: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, id: string, handle: ResizeHandle) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  children?: React.ReactNode;
}

const resizeHandles: ResizeHandle[] = [
  'top-left', 'top', 'top-right',
  'left', 'right',
  'bottom-left', 'bottom', 'bottom-right',
];

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  component,
  parentWidth,
  parentHeight,
  parentLayout,
  parentFlexDirection,
  onClick,
  onDragStart,
  onResizeStart,
  onContextMenu,
  children,
}) => {
  // Self-subscribe: only re-render when THIS component's selection/hover actually changes
  const isSelected = useEditorStore(
    useCallback((s) => s.selection.selectedIds.includes(component.id), [component.id])
  );
  const isHovered = useEditorStore(
    useCallback((s) => s.selection.hoveredId === component.id, [component.id])
  );
  const setHoveredComponent = useEditorStore(state => state.setHoveredComponent);
  const updateComponent = useEditorStore(state => state.updateComponent);
  const defaultFontSize = useAppStore(state => state.defaultFontSize);
  const { styles, props, type } = component;
  const defaultStyle = styles.default;
  // Hard-coded designer colors (table cells, calendar, window header...) follow the project theme
  const th = useThemeStore(state => state.currentTheme.colors);
  const tint = `color-mix(in srgb, ${th.surface} 90%, ${th.text})`;
  const muted = `color-mix(in srgb, ${th.text} 60%, ${th.surface})`;
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const wasSelectedOnDown = useRef(false);
  const [editing, setEditing] = useState(false);
  const canEditText = (component.type === 'label' || component.type === 'btn' || component.type === 'checkbox') && !component.locked;

  const commitText = (value: string) => {
    setEditing(false);
    if (value !== (component.props.text ?? '')) updateComponent(component.id, { props: { ...component.props, text: value } });
  };
  const textEditor = (color: string, fontSize: number | string) => (
    <input
      className="lvgl-inline-edit"
      autoFocus
      defaultValue={component.props.text ?? ''}
      size={Math.max(4, (component.props.text ?? '').length + 1)}
      onInput={(e) => { e.currentTarget.size = Math.max(4, e.currentTarget.value.length + 1); }}
      style={{ color, fontSize }}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => commitText(e.currentTarget.value)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') setEditing(false);
      }}
    />
  );

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

  // Render component content based on type
  const renderContent = () => {
    switch (type) {
      case 'btn':
        return (
          <div className="lvgl-btn" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: defaultStyle.textColor || '#ffffff',
            fontSize: props.fontSize || defaultFontSize,
          }}>
            {children}
            {editing && textEditor(defaultStyle.textColor || '#ffffff', props.fontSize || defaultFontSize)}
            {!editing && (!children || React.Children.count(children) === 0) && (props.text || 'Button')}
          </div>
        );
      
      case 'label':
        return (
          editing ? textEditor(defaultStyle.textColor || th.text, props.fontSize || defaultFontSize) : <span className="lvgl-label" style={{
            color: defaultStyle.textColor || th.text,
            fontSize: props.fontSize || defaultFontSize,
          }}>{props.text || 'Label'}</span>
        );
      
      case 'img':
        return <CanvasImageContent src={props.src} recolor={defaultStyle.imageRecolor} iconColor={th.text} />;
      
      case 'line': {
        // lv_line draws a polyline through its points (object coordinates); default color = theme text
        const pts: number[][] = Array.isArray(props.points) && props.points.length >= 2 ? props.points : [[0, 0], [component.width, 0]];
        return (
          <svg className="lvgl-line" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <polyline
              fill="none"
              points={pts.map(pt => `${Number(pt?.[0]) || 0},${Number(pt?.[1]) || 0}`).join(' ')}
              stroke={props.lineColor || th.text}
              strokeWidth={props.lineWidth ?? 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      }
      
      case 'textarea':
        return (
          <div className="lvgl-textarea" style={{
            width: '100%',
            height: '100%',
            fontSize: '12px',
            color: muted,
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            padding: '6px 8px',
            boxSizing: 'border-box',
          }}>
            {props.text || props.placeholder || 'Enter text...'}
          </div>
        );
      
      case 'dropdown':
        return (
          <div className="lvgl-dropdown" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '0 8px',
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            boxSizing: 'border-box',
            color: defaultStyle.textColor || th.text,
          }}>
            <span>{props.options?.[props.selected || 0] || 'Select...'}</span>
            <span style={{ color: muted, fontSize: '10px' }}>▼</span>
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="lvgl-checkbox" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: defaultStyle.textColor || th.text,
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${muted}`,
              borderRadius: '2px',
              backgroundColor: props.checked ? th.primary : th.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {props.checked && <span style={{ color: '#ffffff', fontSize: '12px', lineHeight: 1 }}>✓</span>}
            </div>
            {editing
              ? textEditor(defaultStyle.textColor || th.text, props.fontSize || defaultFontSize)
              : <span style={{ fontSize: defaultFontSize }}>{props.text || 'Checkbox'}</span>}
          </div>
        );
      
      case 'switch':
        return (
          <div className="lvgl-switch" style={{
            width: '100%',
            height: '100%',
            borderRadius: defaultStyle.borderRadius || 13,
            backgroundColor: props.checked ? th.primary : th.border,
            position: 'relative',
            minHeight: '20px',
          }}>
            <div style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              top: '50%',
              marginTop: '-10px',
              left: props.checked ? 'calc(100% - 23px)' : '3px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'left 0.2s',
            }} />
          </div>
        );
      
      case 'slider': {
        // like the LVGL default theme: the whole object is the track (its own background), the indicator
        // fills from the left in the primary color, the knob is a primary circle slightly taller than the track
        const sMin = props.min ?? 0;
        const sMax = props.max ?? 100;
        const sPct = sMax > sMin ? Math.max(0, Math.min(100, ((props.value ?? 50) - sMin) / (sMax - sMin) * 100)) : 0;
        const knob = component.height * 1.3;
        return (
          <div className="lvgl-slider" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{
              width: `${sPct}%`,
              height: '100%',
              backgroundColor: th.primary,
              borderRadius: defaultStyle.borderRadius ?? 9999,
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: `calc(${sPct}% - ${knob / 2}px)`,
              width: knob,
              height: knob,
              transform: 'translateY(-50%)',
              borderRadius: '50%',
              backgroundColor: th.primary,
            }} />
          </div>
        );
      }
      case 'obj': {
        // Build layout styles for the container based on props.layout
        const layoutStyle: React.CSSProperties = {};
        if (props.layout === 'flex') {
          layoutStyle.display = 'flex';
          layoutStyle.flexDirection = (props.flexDirection === 'column' ? 'column' : 'row') as React.CSSProperties['flexDirection'];
          if (props.flexWrap === 'wrap' || props.flexWrap === true) {
            layoutStyle.flexWrap = 'wrap';
          } else if (props.flexWrap === 'wrap-reverse') {
            layoutStyle.flexWrap = 'wrap-reverse';
          }
          if (props.justifyContent) layoutStyle.justifyContent = props.justifyContent;
          if (props.alignItems) layoutStyle.alignItems = props.alignItems;
          if (props.alignContent) layoutStyle.alignContent = props.alignContent;
          // gap maps to lv_obj_set_style_pad_row/pad_column in codegen
          if (props.gap !== undefined && props.gap > 0) {
            layoutStyle.gap = `${props.gap}px`;
          }
        } else if (props.layout === 'grid') {
          layoutStyle.display = 'grid';
          // Parse grid template: "1fr 2fr 1fr" → CSS grid-template-columns
          if (props.gridColumns) layoutStyle.gridTemplateColumns = props.gridColumns;
          if (props.gridRows) layoutStyle.gridTemplateRows = props.gridRows;
          if (props.gridColumnGap || props.gridRowGap) {
            layoutStyle.gap = `${props.gridRowGap || 0}px ${props.gridColumnGap || 0}px`;
          }
        }
        return (
          <div className="lvgl-obj" style={{
            width: '100%',
            height: '100%',
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            position: 'relative',
            ...layoutStyle,
          }}>
            {children}
          </div>
        );
      }
      
      case 'tabview':
        return (
          <div className="lvgl-tabview" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              borderBottom: `2px solid ${th.border}`,
              backgroundColor: tint,
              flexShrink: 0,
            }}>
              {(props.tabs || ['Tab 1', 'Tab 2']).map((tab: string, i: number) => (
                <div key={i} style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderBottom: i === (props.activeTab || 0) ? `2px solid ${th.primary}` : '2px solid transparent',
                  color: i === (props.activeTab || 0) ? th.primary : muted,
                  fontWeight: i === (props.activeTab || 0) ? 600 : 400,
                  marginBottom: '-2px',
                }} onClick={(e) => {
                  e.stopPropagation();
                  updateComponent(component.id, { props: { ...props, activeTab: i } });
                }}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="lvgl-tabview-content" style={{ flex: 1, padding: '8px' }}>{children}</div>
          </div>
        );
      
      case 'win': {
        // like lv_win: a header bar (default 40 px) with the title and square primary-colored buttons on the right
        const headerH = Number(props.headerHeight) || 40;
        const onPrimary = '#ffffff';
        const hdrBtns: string[] = [];
        if (props.showCloseBtn !== false) hdrBtns.push('✕');
        if (Array.isArray(props.headerButtons)) props.headerButtons.forEach(() => hdrBtns.push('⚙'));
        return (
          <div className="lvgl-win" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              height: headerH,
              padding: '4px 8px 4px 12px',
              boxSizing: 'border-box',
              backgroundColor: tint,
              fontSize: props.fontSize || defaultFontSize,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.title || 'Window'}</span>
              {hdrBtns.map((ic, i) => (
                <span key={i} style={{
                  width: 40,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  backgroundColor: th.primary,
                  color: onPrimary,
                  flexShrink: 0,
                }}>{ic}</span>
              ))}
            </div>
            <div className="lvgl-win-content" style={{ flex: 1, padding: '8px' }}>{children}</div>
          </div>
        );
      }
      
      case 'bar': {
        const barMin = props.min ?? 0;
        const barMax = props.max ?? 100;
        const barVal = props.value ?? 60;
        const barPercent = barMax > barMin ? Math.max(0, Math.min(100, (barVal - barMin) / (barMax - barMin) * 100)) : 0;
        return (
          <div className="lvgl-bar" style={{
            width: '100%',
            height: '100%',
            borderRadius: defaultStyle.borderRadius,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${barPercent}%`,
              height: '100%',
              backgroundColor: th.primary,
              borderRadius: defaultStyle.borderRadius,
              transition: 'width 0.15s',
            }} />
          </div>
        );
      }
      
      case 'arc': {
        // same geometry as LVGL: angles in degrees, 0 = 3 o'clock, clockwise
        const arc = getArcStyle(component);
        const size = Math.max(1, Math.min(component.width, component.height));
        const stroke = Math.min(48, (arc.width * 100) / size);
        const r = 50 - stroke / 2;
        const start = Number(props.startAngle ?? 135);
        const end = Number(props.endAngle ?? 45);
        const total = (((end - start) % 360) + 360) % 360 || 360;
        const min = Number(props.min ?? 0);
        const max = Number(props.max ?? 100);
        const frac = max > min ? Math.max(0, Math.min(1, (Number(props.value ?? 60) - min) / (max - min))) : 0;
        const pt = (deg: number): [number, number] => [50 + r * Math.cos((deg * Math.PI) / 180), 50 + r * Math.sin((deg * Math.PI) / 180)];
        const arcPath = (sweep: number) => {
          if (sweep <= 0.01) return '';
          if (sweep >= 359.99) return `M ${50 + r} 50 A ${r} ${r} 0 1 1 ${50 - r} 50 A ${r} ${r} 0 1 1 ${50 + r} 50`;
          const [x0, y0] = pt(start);
          const [x1, y1] = pt(start + sweep);
          return `M ${x0} ${y0} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1} ${y1}`;
        };
        const [kx, ky] = pt(start + total * frac);
        return (
          <div className="lvgl-arc" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <path d={arcPath(total)} fill="none" stroke={arc.track} strokeWidth={stroke} strokeLinecap="round" />
              {frac > 0 && <path d={arcPath(total * frac)} fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap="round" />}
              <circle cx={kx} cy={ky} r={stroke * 0.7} fill={arc.color} />
            </svg>
          </div>
        );
      }

      case 'spinner': {
        const arc = getArcStyle(component);
        const size = Math.max(1, Math.min(component.width, component.height));
        const stroke = Math.min(48, (arc.width * 100) / size);
        const r = 50 - stroke / 2;
        const circumference = 2 * Math.PI * r;
        return (
          <div className="lvgl-spinner" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', animation: `spin ${(props.speed || 1000) / 1000}s linear infinite` }}>
              <circle cx="50" cy="50" r={r} fill="none" stroke={arc.track} strokeWidth={stroke} />
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={`${((props.arcLength || 60) / 360) * circumference} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      }
      
      case 'chart': {
        const series = props.series || (props.data ? [{ data: props.data, color: props.lineColor || th.primary }] : [{ data: [10, 20, 30, 25, 40], color: th.primary }]);
        const isBar = props.type === 'bar';
        const yMin = Number(props.yAxisMin ?? 0);
        const yMax = Number(props.yAxisMax ?? 100);
        const span = yMax > yMin ? yMax - yMin : 1;
        const pos = (v: number, i: number, n: number): [number, number] => [
          isBar ? ((i + 0.5) / n) * 100 : n > 1 ? (i / (n - 1)) * 100 : 50,
          100 - Math.max(0, Math.min(1, (v - yMin) / span)) * 100,
        ];
        type Ser = { data?: number[]; color?: string };
        return (
          <div className="lvgl-chart" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            boxSizing: 'border-box',
            padding: defaultStyle.paddingTop ?? 10,
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* LVGL draws a 5 x 3 division grid */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="100" stroke={th.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {[0, 1, 2, 3].map(i => (
                  <line key={`h${i}`} x1="0" y1={(i * 100) / 3} x2="100" y2={(i * 100) / 3} stroke={th.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {!isBar && (series as Ser[]).map((sr, si) => {
                  const d = sr.data || [];
                  return (
                    <polyline
                      key={si}
                      fill="none"
                      stroke={sr.color || th.primary}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      points={d.map((v, i) => pos(v, i, d.length).join(',')).join(' ')}
                    />
                  );
                })}
              </svg>
              {(series as Ser[]).map((sr, si) =>
                (sr.data || []).map((v, i, arr) => {
                  const [x, y] = pos(v, i, arr.length);
                  return isBar ? (
                    <div key={`${si}-${i}`} style={{
                      position: 'absolute', left: `${x}%`, width: `${Math.max(3, 60 / arr.length / series.length)}%`,
                      top: `${y}%`, bottom: 0, transform: 'translateX(-50%)',
                      backgroundColor: sr.color || th.primary,
                    }} />
                  ) : (
                    <div key={`${si}-${i}`} style={{
                      position: 'absolute', left: `${x}%`, top: `${y}%`, width: 8, height: 8, borderRadius: '50%',
                      transform: 'translate(-50%, -50%)', backgroundColor: sr.color || th.primary,
                    }} />
                  );
                })
              )}
            </div>
          </div>
        );
      }
      
      case 'table': {
        // lv_table: rows separated by horizontal lines, columns have their own widths, a scrollbar when it overflows
        const rows = Number(props.rows || 3);
        const cols = Number(props.cols || 3);
        const widths: number[] = Array.from({ length: cols }, (_, c) => Number(props.columnWidths?.[c]) || 60);
        const fs = Number(props.fontSize) || defaultFontSize;
        const rowH = Math.round(fs + 42);
        const overflowY = rows * rowH > component.height;
        return (
          <div className="lvgl-table" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            color: th.text,
            fontSize: fs,
            borderRadius: defaultStyle.borderRadius || 0,
          }}>
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} style={{ display: 'flex', height: rowH, boxSizing: 'border-box', borderBottom: `1px solid ${th.border}`, width: widths.reduce((a, w) => a + w, 0) }}>
                {widths.map((w, c) => (
                  <div key={c} style={{ width: w, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {props.cellData?.[r]?.[c] || ''}
                  </div>
                ))}
              </div>
            ))}
            {overflowY && <div style={{ position: 'absolute', right: 4, top: 4, width: 4, height: '45%', borderRadius: 2, backgroundColor: th.border }} />}
          </div>
        );
      }
      
      case 'calendar': {
        // like LVGL: weekday row + full month grid, neighbouring months dimmed, "today" boxed
        const year = Number(props.year ?? 2024);
        const month = Number(props.month ?? 1);
        const first = new Date(year, month - 1, 1).getDay();
        const daysIn = new Date(year, month, 0).getDate();
        const prevDays = new Date(year, month - 1, 0).getDate();
        const cells = Array.from({ length: 42 }).map((_, i) => {
          const dn = i - first + 1;
          if (dn < 1) return { n: prevDays + dn, other: true };
          if (dn > daysIn) return { n: dn - daysIn, other: true };
          return { n: dn, other: false };
        });
        // LVGL always shows 6 weeks (42 days), so the grid runs on into the next month
        return (
          <div className="lvgl-calendar" style={{
            width: '100%',
            height: '100%',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            boxSizing: 'border-box',
            overflow: 'hidden',
            color: th.text,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: '1px', flex: 1, padding: '2px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', alignSelf: 'center' }}>{d}</div>
              ))}
              {cells.map((c, i) => {
                const today = !c.other && props.showToday && c.n === 1;
                return (
                  <div key={i} style={{
                    justifySelf: 'center', alignSelf: 'center',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 3,
                    border: today ? `2px solid ${th.primary}` : c.other ? '1px solid transparent' : `1px solid ${th.border}`,
                    boxSizing: 'border-box',
                    opacity: c.other ? 0.7 : 1,
                  }}>{c.n}</div>
                );
              })}
            </div>
          </div>
        );
      }
      
      case 'tileview':
        return (
          <div className="lvgl-tileview" style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: `repeat(${props.cols || 2}, 1fr)`,
            gridTemplateRows: `repeat(${props.rows || 2}, 1fr)`,
            gap: '2px',
            backgroundColor: th.border,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            overflow: 'hidden',
          }}>
            {Array.from({ length: (props.rows || 2) * (props.cols || 2) }).map((_, i) => (
              <div key={i} style={{ backgroundColor: tint, border: `1px dashed ${th.border}` }} />
            ))}
          </div>
        );
      
      default:
        return <div>{type}</div>;
    }
  };

  return (
    <div
      className={`canvas-component ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${component.locked ? 'locked' : ''} ${component.visible === false ? 'hidden-component' : ''}`}
      style={componentStyle}
      onClick={(e) => {
        onClick(e, component.id);
        // A plain click (not a drag) on an image opens the resource manager to pick its picture
        const d = downPos.current;
        const still = !d || Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4;
        if (component.type === 'img' && !component.locked && still) {
          window.dispatchEvent(new CustomEvent('pick-image', { detail: { id: component.id } }));
        } else if (canEditText && still && wasSelectedOnDown.current) {
          setEditing(true); // second click on a selected label / button: type in place
        }
      }}
      onDoubleClick={() => { if (canEditText) setEditing(true); }}
      onMouseDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY };
        wasSelectedOnDown.current = isSelected;
        onDragStart(e, component.id);
      }}
      onMouseEnter={() => setHoveredComponent(component.id)}
      onMouseLeave={() => setHoveredComponent(null)}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, component.id) : undefined}
    >
      {renderContent()}
      
      {/* Align badge */}
      {component.align && component.align !== 'default' && (
        <div className="align-badge" title={t('Align: {0}', component.align)}>
          {component.align === 'center' ? '⊕' :
           component.align === 'top_mid' ? '⬆' :
           component.align === 'bottom_mid' ? '⬇' :
           component.align === 'left_mid' ? '⬅' :
           component.align === 'right_mid' ? '➡' :
           component.align === 'top_left' ? '↖' :
           component.align === 'top_right' ? '↗' :
           component.align === 'bottom_left' ? '↙' :
           component.align === 'bottom_right' ? '↘' : '⊕'}
        </div>
      )}

      {/* Selection overlay with resize handles */}
      {isSelected && (
        <div className="selection-overlay">
          {resizeHandles.map(handle => (
            <div
              key={handle}
              className={`resize-handle ${handle}`}
              onMouseDown={(e) => onResizeStart(e, component.id, handle)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Separate component to subscribe to resource store only for img type
const CanvasImageContent: React.FC<{ src?: string; recolor?: string; iconColor?: string }> = React.memo(({ src, recolor, iconColor }) => {
  const images = useResourceStore((s) => s.images);
  const matched = src
    ? images.find((img) => img.id === src || img.name === src)
    : undefined;

  if (matched) {
    // icons (and images with an explicit recolor) are painted with a color through the image's alpha mask
    const tint = recolor || (matched.originalName.startsWith('icon_') ? iconColor : undefined);
    if (tint) {
      return (
        <div
          className="lvgl-img"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: tint,
            WebkitMaskImage: `url(${matched.data})`,
            maskImage: `url(${matched.data})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        />
      );
    }
    return (
      <div
        className="lvgl-img"
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${matched.data})`,
          backgroundSize: '100% 100%',
        }}
      />
    );
  }

  return (
    <div
      className="lvgl-img"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: '#94a3b8',
      }}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
    </div>
  );
});

export default React.memo(CanvasComponent);
