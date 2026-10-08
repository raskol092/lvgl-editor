import React, { useCallback, useRef, useState } from 'react';
import { renderExtraWidget } from './extraWidgets';
import { buildComponentStyle } from './parts/componentStyle';
import { renderArc } from './parts/renderers/renderArc';
import { renderBar } from './parts/renderers/renderBar';
import { renderBtn } from './parts/renderers/renderBtn';
import { renderCalendar } from './parts/renderers/renderCalendar';
import { renderChart } from './parts/renderers/renderChart';
import { renderCheckbox } from './parts/renderers/renderCheckbox';
import { renderDropdown } from './parts/renderers/renderDropdown';
import { renderImg } from './parts/renderers/renderImg';
import { renderLabel } from './parts/renderers/renderLabel';
import { renderLed } from './parts/renderers/renderLed';
import { renderLine } from './parts/renderers/renderLine';
import { renderObj } from './parts/renderers/renderObj';
import { renderSlider } from './parts/renderers/renderSlider';
import { renderSpinner } from './parts/renderers/renderSpinner';
import { renderSwitch } from './parts/renderers/renderSwitch';
import { renderTable } from './parts/renderers/renderTable';
import { renderTabview } from './parts/renderers/renderTabview';
import { renderTextarea } from './parts/renderers/renderTextarea';
import { renderTileview } from './parts/renderers/renderTileview';
import { renderWin } from './parts/renderers/renderWin';
import type { RenderCtx } from './parts/types';
import { t } from '../../i18n';
import { useAppStore } from '../../store/appStore';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import type { LvglComponent, ResizeHandle } from '../../types';
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

  const buildArgs = { component, th, tint, muted, parentWidth, parentHeight, parentLayout, parentFlexDirection, defaultFontSize };
  const { componentStyle, resolvedBgColor, background, borderStyles, paddingStyles, outlineStyles } = buildComponentStyle(buildArgs);

  // Render component content based on type
  const renderContent = () => {
    const ctx: RenderCtx = {
      component, props, type, styles, defaultStyle, th, tint, muted, defaultFontSize, children, editing, textEditor, resolvedBgColor,
      background, borderStyles, paddingStyles, outlineStyles, canEditText, parentWidth, parentHeight, parentLayout, isSelected, setEditing, updateComponent,
    };
    switch (type) {
      case 'btn': return renderBtn(ctx);
      case 'label': return renderLabel(ctx);
      case 'img': return renderImg(ctx);
      case 'line': return renderLine(ctx);
      case 'textarea': return renderTextarea(ctx);
      case 'dropdown': return renderDropdown(ctx);
      case 'checkbox': return renderCheckbox(ctx);
      case 'switch': return renderSwitch(ctx);
      case 'slider': return renderSlider(ctx);
      case 'obj': return renderObj(ctx);
      case 'tabview': return renderTabview(ctx);
      case 'win': return renderWin(ctx);
      case 'led': return renderLed(ctx);
      case 'bar': return renderBar(ctx);
      case 'arc': return renderArc(ctx);
      case 'spinner': return renderSpinner(ctx);
      case 'chart': return renderChart(ctx);
      case 'table': return renderTable(ctx);
      case 'calendar': return renderCalendar(ctx);
      case 'tileview': return renderTileview(ctx);
      default:
        return renderExtraWidget({ component, th, fontSize: Number(props.fontSize) || defaultFontSize, tint, muted, textColor: defaultStyle.textColor || th.text }) ?? <div>{type}</div>;
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

export default React.memo(CanvasComponent);
