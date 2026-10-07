import { Link2, Unlock } from 'lucide-react';
import Emoji from '../icons/Emoji';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useResourceStore } from '../../resources/resourceStore';
import { useAppStore } from '../../store/appStore';
import { useProjectStore } from '../../store/projectStore';
import type { LvglComponent, StyleProps, LvglAlign, LvglFlags } from '../../types';
import { getComponentDefinition } from '../../utils/componentDefinitions';
import { t } from '../../i18n';
import ToolIcon from '../icons/ToolIcon';
import './PropertyEditor.css';

// Inline CollapsibleSection component
const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}><Emoji c="▶" /></span>
        <span>{title}</span>
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
};

// Align grid constants
const ALIGN_OPTIONS: { value: LvglAlign; label: string; row: number; col: number }[] = [
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
const BUILTIN_FONTS = [
  'montserrat_14',
  'montserrat_16',
  'montserrat_20',
  'montserrat_24',
  'montserrat_28',
  'montserrat_32',
];

// Grid template visualization: parse "1fr 2fr 1fr" into proportional bars
function GridTemplatePreview({ value }: { value: string }) {
  const parts = (value || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map(p => {
    const n = parseFloat(p);
    return isNaN(n) || n <= 0 ? 1 : n;
  });
  return (
    <div className="grid-template-preview">
      {nums.map((n, i) => (
        <div
          key={i}
          className="grid-template-bar"
          style={{ flex: n }}
          title={parts[i]}
        >
          <span className="grid-template-bar-label">{parts[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Style section visibility per component type (Task 2)
const STYLE_SECTION_VISIBILITY: Record<string, Set<string>> = {
  shadow: new Set(['btn', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'table', 'chart', 'calendar', 'bar', 'arc']),
  transform: new Set(['btn', 'label', 'img', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'checkbox', 'switch', 'slider', 'bar', 'arc', 'spinner', 'chart', 'table', 'calendar']),
  gradient: new Set(['btn', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'bar', 'slider']),
  outline: new Set(['btn', 'obj', 'tabview', 'tileview', 'win', 'textarea', 'dropdown', 'checkbox', 'switch', 'slider', 'bar', 'arc', 'table', 'chart', 'calendar']),
  scrollbar: new Set(['obj', 'tabview', 'tileview', 'win', 'textarea']),
  textStyle: new Set(['btn', 'label', 'textarea', 'dropdown', 'checkbox', 'table', 'calendar']),
  blendMode: new Set(['btn', 'label', 'img', 'obj', 'chart']),
};

// Flags that only apply to container-like components
const SCROLL_FLAGS = new Set(['scrollable', 'scrollElastic', 'scrollMomentum', 'scrollOnFocus']);
const CONTAINER_TYPES = new Set(['obj', 'tabview', 'tileview', 'win']);

// Helper to check if a style section should be visible for a component type
function isSectionVisible(section: string, componentType: string): boolean {
  const allowed = STYLE_SECTION_VISIBILITY[section];
  return !allowed || allowed.has(componentType);
}

// Dropdown options list editor (Task 3)
const DropdownOptionsEditor: React.FC<{
  options: string[];
  onChange: (options: string[]) => void;
}> = ({ options, onChange }) => {
  const handleTextChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    onChange(newOptions);
  };

  const handleMoveDown = (index: number) => {
    if (index >= options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    onChange(newOptions);
  };

  const handleDelete = (index: number) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...options, `${t('Option')} ${options.length + 1}`]);
  };

  return (
    <div className="dropdown-options-editor">
      {options.map((opt, i) => (
        <div key={i} className="dropdown-option-row">
          <span className="dropdown-option-index">{i + 1}</span>
          <input
            type="text"
            className="dropdown-option-input"
            value={opt}
            onChange={(e) => handleTextChange(i, e.target.value)}
          />
          <button
            className="dropdown-option-btn"
            onClick={() => handleMoveUp(i)}
            disabled={i === 0}
            title={t('Move up')}
          ><Emoji c="↑" /></button>
          <button
            className="dropdown-option-btn"
            onClick={() => handleMoveDown(i)}
            disabled={i === options.length - 1}
            title={t('Move down')}
          ><Emoji c="↓" /></button>
          <button
            className="dropdown-option-btn delete"
            onClick={() => handleDelete(i)}
            disabled={options.length <= 1}
            title={t('Delete')}
          ><Emoji c="✕" /></button>
        </div>
      ))}
      <button className="dropdown-option-add" onClick={handleAdd}>{t('+ Add option')}</button>
    </div>
  );
};

// Toggle switch UI component (Task 4.3)
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div className="toggle-switch-wrapper" onClick={() => onChange(!checked)}>
    {label && <span className="toggle-switch-label">{label}</span>}
    <div className={`toggle-switch ${checked ? 'on' : ''}`}>
      <div className="toggle-switch-knob" />
    </div>
  </div>
);

type StyleState = 'default' | 'pressed' | 'focused' | 'disabled';

const STYLE_STATES: { key: StyleState; label: string }[] = [
  { key: 'default', label: t('Default') },
  { key: 'pressed', label: t('Press') },
  { key: 'focused', label: t('Focused state') },
  { key: 'disabled', label: t('Disabled') },
];

const PropertyEditor: React.FC = () => {
  const { selection, getComponentById, updateComponent } = useEditorStore();
  const [activeStyleState, setActiveStyleState] = useState<StyleState>('default');
  const [paddingLinked, setPaddingLinked] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [radiusLinked, setRadiusLinked] = useState(true);
  
  const selectedId = selection.selectedIds[0];
  const component = selectedId ? getComponentById(selectedId) : undefined;
  const definition = component ? getComponentDefinition(component.type) : undefined;

  // Look up parent component for flex/grid child properties
  const parentComponent = useMemo(() => {
    if (!component || !component.parentId) return undefined;
    return getComponentById(component.parentId);
  }, [component, getComponentById]);

  const parentLayout = parentComponent?.props?.layout as string | undefined;

  // Get the current style object for the active state
  const currentStyles: StyleProps = component
    ? (component.styles[activeStyleState] || component.styles.default)
    : {};

  // Whether the active state has its own overrides
  const hasStateOverride = component ? !!component.styles[activeStyleState] : false;

  const handlePropertyChange = useCallback(
    (property: keyof LvglComponent, value: LvglComponent[keyof LvglComponent]) => {
      if (!selectedId) return;
      updateComponent(selectedId, { [property]: value });
    },
    [selectedId, updateComponent]
  );

  const handleStyleChange = useCallback(
    (styleKey: keyof StyleProps, value: StyleProps[keyof StyleProps]) => {
      if (!selectedId || !component) return;
      const baseStyles = component.styles[activeStyleState] || { ...component.styles.default };
      updateComponent(selectedId, {
        styles: {
          ...component.styles,
          [activeStyleState]: {
            ...baseStyles,
            [styleKey]: value,
          },
        },
      });
    },
    [selectedId, component, updateComponent, activeStyleState]
  );

  const handleClearStateOverride = useCallback(() => {
    if (!selectedId || !component || activeStyleState === 'default') return;
    const newStyles = { ...component.styles };
    delete newStyles[activeStyleState];
    updateComponent(selectedId, { styles: newStyles });
  }, [selectedId, component, updateComponent, activeStyleState]);

  const handlePropsChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (propKey: string, value: any) => {
      if (!selectedId || !component) return;
      updateComponent(selectedId, {
        props: {
          ...component.props,
          [propKey]: value,
        },
      });
    },
    [selectedId, component, updateComponent]
  );

  const handleBatchPropsChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updates: Record<string, any>) => {
      if (!selectedId || !component) return;
      updateComponent(selectedId, {
        props: {
          ...component.props,
          ...updates,
        },
      });
    },
    [selectedId, component, updateComponent]
  );

  if (!component) {
    return (
      <div className="property-editor">
        <div className="panel-header">
          <h3>{t('Properties')}</h3>
        </div>
        <div className="no-selection">
          <p>{t('No component selected')}</p>
          <p className="hint">{t('Click a component on the canvas to edit it')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-editor">
      <div className="panel-header">
        <h3>{t('Properties')}</h3>
      </div>
      
      <div className="property-sections">
        {/* Component Info */}
        <div className="property-section">
          <div className="section-header">{t('Component info')}</div>
          <div className="property-row">
            <label>{t('Type')}</label>
            <div className="property-value readonly">
              <span className="component-type-icon"><ToolIcon name={component.type} size={16} fallback={definition?.icon} /></span>
              {definition?.name || component.type}
            </div>
          </div>
          <div className="property-row">
            <label>{t('Name')}</label>
            <input
              type="text"
              value={component.name}
              onChange={(e) => handlePropertyChange('name', e.target.value)}
            />
          </div>
        </div>

        {/* Position */}
        <div className="property-section">
          <div className="section-header">{t('Position')}</div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>X</label>
              <input
                type="number"
                value={component.x}
                onChange={(e) => handlePropertyChange('x', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>Y</label>
              <input
                type="number"
                value={component.y}
                onChange={(e) => handlePropertyChange('y', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="property-section">
          <div className="section-header">{t('Size')}</div>
          {/* Width */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label style={{ fontSize: 12, color: '#666', width: 32, flexShrink: 0 }}>{t('Width')}</label>
              <div className="size-mode-switcher">
                {(['px', 'percent', 'content'] as const).map((m) => (
                  <button
                    key={m}
                    className={`size-mode-btn ${(component.widthMode || 'px') === m ? 'active' : ''}`}
                    onClick={() => handlePropertyChange('widthMode', m)}
                  >
                    {m === 'px' ? 'px' : m === 'percent' ? '%' : 'auto'}
                  </button>
                ))}
              </div>
            </div>
            {(component.widthMode || 'px') === 'content' ? (
              <div style={{ fontSize: 12, color: '#999', padding: '6px 8px', background: '#1e293b', borderRadius: 4 }}>{t('Fit content')}</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  value={component.width}
                  min={(component.widthMode || 'px') === 'percent' ? 1 : 10}
                  max={(component.widthMode || 'px') === 'percent' ? 100 : undefined}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || ((component.widthMode || 'px') === 'percent' ? 1 : 10);
                    const min = (component.widthMode || 'px') === 'percent' ? 1 : 10;
                    const max = (component.widthMode || 'px') === 'percent' ? 100 : Infinity;
                    handlePropertyChange('width', Math.min(max, Math.max(min, v)));
                  }}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
                />
                {(component.widthMode || 'px') === 'percent' && (
                  <span style={{ fontSize: 12, color: '#888' }}>%</span>
                )}
              </div>
            )}
          </div>
          {/* Height */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <label style={{ fontSize: 12, color: '#666', width: 32, flexShrink: 0 }}>{t('Height')}</label>
              <div className="size-mode-switcher">
                {(['px', 'percent', 'content'] as const).map((m) => (
                  <button
                    key={m}
                    className={`size-mode-btn ${(component.heightMode || 'px') === m ? 'active' : ''}`}
                    onClick={() => handlePropertyChange('heightMode', m)}
                  >
                    {m === 'px' ? 'px' : m === 'percent' ? '%' : 'auto'}
                  </button>
                ))}
              </div>
            </div>
            {(component.heightMode || 'px') === 'content' ? (
              <div style={{ fontSize: 12, color: '#999', padding: '6px 8px', background: '#1e293b', borderRadius: 4 }}>{t('Fit content')}</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  value={component.height}
                  min={(component.heightMode || 'px') === 'percent' ? 1 : 10}
                  max={(component.heightMode || 'px') === 'percent' ? 100 : undefined}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || ((component.heightMode || 'px') === 'percent' ? 1 : 10);
                    const min = (component.heightMode || 'px') === 'percent' ? 1 : 10;
                    const max = (component.heightMode || 'px') === 'percent' ? 100 : Infinity;
                    handlePropertyChange('height', Math.min(max, Math.max(min, v)));
                  }}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
                />
                {(component.heightMode || 'px') === 'percent' && (
                  <span style={{ fontSize: 12, color: '#888' }}>%</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alignment */}
        <div className="property-section">
          <div className="section-header">{t('Align')}</div>
          <div className="align-grid">
            {ALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`align-grid-btn ${(component.align || 'default') === opt.value ? 'active' : ''}`}
                style={{ gridRow: opt.row + 1, gridColumn: opt.col + 1 }}
                onClick={() => handlePropertyChange('align', opt.value)}
                title={opt.value}
              >
                <Emoji c={opt.label} />
              </button>
            ))}
          </div>
          <div className="property-row" style={{ marginTop: 8 }}>
            <label>{t('Align')}</label>
            <select
              value={component.align || 'default'}
              onChange={(e) => handlePropertyChange('align', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
            >
              <option value="default">{t('Default')}</option>
              <option value="center">{t('Center')}</option>
              <option value="top_left">{t('Top left')}</option>
              <option value="top_mid">{t('Top middle')}</option>
              <option value="top_right">{t('Top right')}</option>
              <option value="left_mid">{t('Left middle')}</option>
              <option value="right_mid">{t('Right middle')}</option>
              <option value="bottom_left">{t('Bottom left')}</option>
              <option value="bottom_mid">{t('Bottom middle')}</option>
              <option value="bottom_right">{t('Bottom right')}</option>
            </select>
          </div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Offset X')}</label>
              <input
                type="number"
                value={component.alignOffsetX || 0}
                onChange={(e) => handlePropertyChange('alignOffsetX', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>{t('Offset Y')}</label>
              <input
                type="number"
                value={component.alignOffsetY || 0}
                onChange={(e) => handlePropertyChange('alignOffsetY', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="property-section">
          <div className="section-header">Flags</div>
          {renderFlagsSection(component, handlePropertyChange)}
        </div>

        {/* Styles */}
        <div className="property-section">
          <div className="section-header">{t('Style')}</div>
          
          {/* Style state switcher */}
          <div className="style-state-switcher">
            {STYLE_STATES.map(({ key, label }) => (
              <button
                key={key}
                className={`style-state-btn ${activeStyleState === key ? 'active' : ''} ${key !== 'default' && component.styles[key] ? 'has-override' : ''}`}
                onClick={() => setActiveStyleState(key)}
              >
                {label}
              </button>
            ))}
          </div>
          
          {activeStyleState !== 'default' && (
            <div className="style-state-info">
              {hasStateOverride ? (
                <button className="clear-override-btn" onClick={handleClearStateOverride}>
                  {t('Clear')}{STYLE_STATES.find(s => s.key === activeStyleState)?.label}{t('State styles')}
                </button>
              ) : (
                <span className="inherit-hint">{t('Inherits the default style; editing creates an independent style')}</span>
              )}
            </div>
          )}
          
          <div className="property-row">
            <label>{t('Background color')}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={currentStyles.bgColor || '#ffffff'}
                onChange={(e) => handleStyleChange('bgColor', e.target.value)}
              />
              <input
                type="text"
                value={currentStyles.bgColor || '#ffffff'}
                onChange={(e) => handleStyleChange('bgColor', e.target.value)}
                className="color-text"
              />
            </div>
          </div>
          
          <div className="property-row">
            <label>{t('Border color')}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={currentStyles.borderColor || '#cccccc'}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
              />
              <input
                type="text"
                value={currentStyles.borderColor || '#cccccc'}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                className="color-text"
              />
            </div>
          </div>
          
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Border width')}</label>
              <input
                type="number"
                value={currentStyles.borderWidth || 0}
                min={0}
                onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label>{t('Radius')}</label>
                <button
                  className={`link-toggle-btn small ${radiusLinked ? 'linked' : ''}`}
                  onClick={() => {
                    if (radiusLinked) {
                      const v = currentStyles.borderRadius || 0;
                      handleStyleChange('borderRadiusTopLeft', v);
                      handleStyleChange('borderRadiusTopRight', v);
                      handleStyleChange('borderRadiusBottomLeft', v);
                      handleStyleChange('borderRadiusBottomRight', v);
                    } else {
                      handleStyleChange('borderRadius', currentStyles.borderRadiusTopLeft || 0);
                    }
                    setRadiusLinked(!radiusLinked);
                  }}
                  title={radiusLinked ? t('Set separately') : t('Set uniformly')}
                >{radiusLinked ? <Link2 size={14} /> : <Unlock size={14} />}</button>
              </div>
              {radiusLinked && (
                <input
                  type="number"
                  value={currentStyles.borderRadius || 0}
                  min={0}
                  onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value) || 0)}
                />
              )}
            </div>
          </div>
          {!radiusLinked && (
            <div className="four-dir-grid">
              <div className="property-field">
                <label>{t('Top left')}</label>
                <input type="number" value={currentStyles.borderRadiusTopLeft || 0} min={0}
                  onChange={(e) => handleStyleChange('borderRadiusTopLeft', parseInt(e.target.value) || 0)} />
              </div>
              <div className="property-field">
                <label>{t('Top right')}</label>
                <input type="number" value={currentStyles.borderRadiusTopRight || 0} min={0}
                  onChange={(e) => handleStyleChange('borderRadiusTopRight', parseInt(e.target.value) || 0)} />
              </div>
              <div className="property-field">
                <label>{t('Bottom left')}</label>
                <input type="number" value={currentStyles.borderRadiusBottomLeft || 0} min={0}
                  onChange={(e) => handleStyleChange('borderRadiusBottomLeft', parseInt(e.target.value) || 0)} />
              </div>
              <div className="property-field">
                <label>{t('Bottom right')}</label>
                <input type="number" value={currentStyles.borderRadiusBottomRight || 0} min={0}
                  onChange={(e) => handleStyleChange('borderRadiusBottomRight', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Border side selector */}
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label style={{ width: 'auto' }}>{t('Border sides')}</label>
            <div className="border-side-group">
              {([
                ['full', t('All')], ['top', t('Top')], ['bottom', t('Bottom')], ['left', t('Left')],
                ['right', t('Right')], ['top_bottom', t('Top & bottom')], ['left_right', t('Left & right')], ['none', t('None')],
              ] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  className={`border-side-btn ${(currentStyles.borderSide || 'full') === val ? 'active' : ''}`}
                  onClick={() => handleStyleChange('borderSide', val)}
                >{lbl}</button>
              ))}
            </div>
          </div>
          
          <div className="property-row">
            <label>{t('Opacity')}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={currentStyles.opacity ?? 1}
              onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            />
            <span className="range-value">{((currentStyles.opacity ?? 1) * 100).toFixed(0)}%</span>
          </div>

          <div className="property-row">
            <label>{t('Text color')}</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={currentStyles.textColor || '#333333'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
              />
              <input
                type="text"
                value={currentStyles.textColor || '#333333'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="color-text"
              />
            </div>
          </div>

          <div className="property-row">
            <label>{t('Padding')}</label>
            {paddingLinked ? (
              <input
                type="number"
                value={currentStyles.padding || 0}
                min={0}
                onChange={(e) => handleStyleChange('padding', parseInt(e.target.value) || 0)}
                style={{ flex: 1 }}
              />
            ) : <span style={{ flex: 1 }} />}
            <button
              className={`link-toggle-btn ${paddingLinked ? 'linked' : ''}`}
              onClick={() => {
                if (paddingLinked) {
                  const v = currentStyles.padding || 0;
                  handleStyleChange('paddingTop', v);
                  handleStyleChange('paddingBottom', v);
                  handleStyleChange('paddingLeft', v);
                  handleStyleChange('paddingRight', v);
                } else {
                  handleStyleChange('padding', currentStyles.paddingTop || 0);
                }
                setPaddingLinked(!paddingLinked);
              }}
              title={paddingLinked ? t('Set separately') : t('Set uniformly')}
            >{paddingLinked ? <Link2 size={14} /> : <Unlock size={14} />}</button>
          </div>
          {!paddingLinked && (
            <div className="four-dir-grid">
              <div className="property-field">
                <label>{t('Top')}</label>
                <input type="number" value={currentStyles.paddingTop || 0} min={0}
                  onChange={(e) => handleStyleChange('paddingTop', parseInt(e.target.value) || 0)} />
              </div>
              <div className="property-field">
                <label>{t('Bottom')}</label>
                <input type="number" value={currentStyles.paddingBottom || 0} min={0}
                  onChange={(e) => handleStyleChange('paddingBottom', parseInt(e.target.value) || 0)} />
              </div>
              <div className="property-field">
                <label>{t('Left')}</label>
                <input type="number" value={currentStyles.paddingLeft || 0} min={0}
                  onChange={(e) => handleStyleChange('paddingLeft', parseInt(e.target.value) || 0)} />
              </div>
              <div className="property-field">
                <label>{t('Right')}</label>
                <input type="number" value={currentStyles.paddingRight || 0} min={0}
                  onChange={(e) => handleStyleChange('paddingRight', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Shadow */}
          {isSectionVisible('shadow', component.type) && <CollapsibleSection title={t('Shadow')}>
            <div className="property-row">
              <label>{t('Color')}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentStyles.shadowColor || '#000000'}
                  onChange={(e) => handleStyleChange('shadowColor', e.target.value)}
                />
                <input
                  type="text"
                  value={currentStyles.shadowColor || '#000000'}
                  onChange={(e) => handleStyleChange('shadowColor', e.target.value)}
                  className="color-text"
                />
              </div>
            </div>
            <div className="property-row">
              <label>{t('Width')}</label>
              <input
                type="number"
                value={currentStyles.shadowWidth || 0}
                min={0}
                onChange={(e) => handleStyleChange('shadowWidth', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row two-col">
              <div className="property-field">
                <label>{t('Offset X')}</label>
                <input
                  type="number"
                  value={currentStyles.shadowOffsetX || 0}
                  onChange={(e) => handleStyleChange('shadowOffsetX', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="property-field">
                <label>{t('Offset Y')}</label>
                <input
                  type="number"
                  value={currentStyles.shadowOffsetY || 0}
                  onChange={(e) => handleStyleChange('shadowOffsetY', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="property-row">
              <label>{t('Spread')}</label>
              <input
                type="number"
                value={currentStyles.shadowSpread || 0}
                min={0}
                onChange={(e) => handleStyleChange('shadowSpread', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>{t('Opacity')}</label>
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={currentStyles.shadowOpacity ?? 255}
                onChange={(e) => handleStyleChange('shadowOpacity', parseInt(e.target.value))}
              />
              <span className="range-value">{currentStyles.shadowOpacity ?? 255}</span>
            </div>
          </CollapsibleSection>}

          {/* Transform */}
          {isSectionVisible('transform', component.type) && <CollapsibleSection title={t('Transform')}>
            <div className="property-row">
              <label>{t('Rotation angle')}</label>
              <input
                type="range"
                min={0}
                max={3600}
                step={1}
                value={currentStyles.transformAngle || 0}
                onChange={(e) => handleStyleChange('transformAngle', parseInt(e.target.value))}
              />
              <span className="range-value">{((currentStyles.transformAngle || 0) / 10).toFixed(1)}°</span>
            </div>
            <div className="property-row two-col">
              <div className="property-field">
                <label>{t('Scale X (%)')}</label>
                <input
                  type="range"
                  min={0}
                  max={1024}
                  step={1}
                  value={currentStyles.transformZoomX ?? 256}
                  onChange={(e) => handleStyleChange('transformZoomX', parseInt(e.target.value))}
                />
                <span className="range-value" style={{ textAlign: 'center' }}>{((currentStyles.transformZoomX ?? 256) / 256 * 100).toFixed(0)}%</span>
              </div>
              <div className="property-field">
                <label>{t('Scale Y (%)')}</label>
                <input
                  type="range"
                  min={0}
                  max={1024}
                  step={1}
                  value={currentStyles.transformZoomY ?? 256}
                  onChange={(e) => handleStyleChange('transformZoomY', parseInt(e.target.value))}
                />
                <span className="range-value" style={{ textAlign: 'center' }}>{((currentStyles.transformZoomY ?? 256) / 256 * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="property-row two-col">
              <div className="property-field">
                <label>{t('Pivot X')}</label>
                <input
                  type="number"
                  value={currentStyles.transformPivotX || 0}
                  onChange={(e) => handleStyleChange('transformPivotX', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="property-field">
                <label>{t('Pivot Y')}</label>
                <input
                  type="number"
                  value={currentStyles.transformPivotY || 0}
                  onChange={(e) => handleStyleChange('transformPivotY', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CollapsibleSection>}

          {/* Scrollbar */}
          {isSectionVisible('scrollbar', component.type) && <CollapsibleSection title={t('Scrollbar')}>
            <div className="property-row">
              <label>{t('Mode')}</label>
              <select
                value={currentStyles.scrollbarMode || 'auto'}
                onChange={(e) => handleStyleChange('scrollbarMode', e.target.value)}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
              >
                <option value="off">{t('Off')}</option>
                <option value="on">{t('Always visible')}</option>
                <option value="active">{t('Visible when active')}</option>
                <option value="auto">{t('Auto')}</option>
              </select>
            </div>
            <div className="property-row">
              <label>{t('Width')}</label>
              <input
                type="number"
                value={currentStyles.scrollbarWidth || 0}
                min={0}
                onChange={(e) => handleStyleChange('scrollbarWidth', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>{t('Color')}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentStyles.scrollbarColor || '#cccccc'}
                  onChange={(e) => handleStyleChange('scrollbarColor', e.target.value)}
                />
                <input
                  type="text"
                  value={currentStyles.scrollbarColor || '#cccccc'}
                  onChange={(e) => handleStyleChange('scrollbarColor', e.target.value)}
                  className="color-text"
                />
              </div>
            </div>
          </CollapsibleSection>}

          {/* Text / Font */}
          {isSectionVisible('textStyle', component.type) && <CollapsibleSection title={t('Text')}>
            <FontSelector currentStyles={currentStyles} handleStyleChange={handleStyleChange} />
            <div className="property-row">
              <label>{t('Font size')}</label>
              <input
                type="number"
                value={currentStyles.textFontSize || 14}
                min={8}
                max={128}
                onChange={(e) => handleStyleChange('textFontSize', parseInt(e.target.value) || 14)}
              />
            </div>
            <div className="property-row two-col">
              <div className="property-field">
                <label>{t('Letter spacing')}</label>
                <input
                  type="number"
                  value={currentStyles.textLetterSpace || 0}
                  onChange={(e) => handleStyleChange('textLetterSpace', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="property-field">
                <label>{t('Line spacing')}</label>
                <input
                  type="number"
                  value={currentStyles.textLineSpace || 0}
                  onChange={(e) => handleStyleChange('textLineSpace', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="property-row">
              <label>{t('Text decoration')}</label>
              <select
                value={currentStyles.textDecor || 'none'}
                onChange={(e) => handleStyleChange('textDecor', e.target.value as StyleProps['textDecor'])}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
              >
                <option value="none">{t('None')}</option>
                <option value="underline">{t('Underline')}</option>
                <option value="strikethrough">{t('Strikethrough')}</option>
              </select>
            </div>
          </CollapsibleSection>}

          {/* Gradient */}
          {isSectionVisible('gradient', component.type) && <CollapsibleSection title={t('Gradient')}>
            <div className="property-row">
              <label>{t('Direction')}</label>
              <select
                value={currentStyles.bgGradDir || 'none'}
                onChange={(e) => handleStyleChange('bgGradDir', e.target.value as StyleProps['bgGradDir'])}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
              >
                <option value="none">{t('None')}</option>
                <option value="hor">{t('Horizontal')}</option>
                <option value="ver">{t('Vertical')}</option>
              </select>
            </div>
            <div className="property-row">
              <label>{t('Gradient color')}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentStyles.bgGradColor || '#000000'}
                  onChange={(e) => handleStyleChange('bgGradColor', e.target.value)}
                />
                <input
                  type="text"
                  value={currentStyles.bgGradColor || '#000000'}
                  onChange={(e) => handleStyleChange('bgGradColor', e.target.value)}
                  className="color-text"
                />
              </div>
            </div>
            <div className="property-row">
              <label>{t('Stop')}</label>
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={currentStyles.bgGradStop ?? 128}
                onChange={(e) => handleStyleChange('bgGradStop', parseInt(e.target.value))}
              />
              <span className="range-value">{currentStyles.bgGradStop ?? 128}</span>
            </div>
          </CollapsibleSection>}

          {/* Outline */}
          {isSectionVisible('outline', component.type) && <CollapsibleSection title="Outline">
            <div className="property-row">
              <label>{t('Color')}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentStyles.outlineColor || '#000000'}
                  onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                />
                <input
                  type="text"
                  value={currentStyles.outlineColor || '#000000'}
                  onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                  className="color-text"
                />
              </div>
            </div>
            <div className="property-row">
              <label>{t('Width')}</label>
              <input
                type="number"
                value={currentStyles.outlineWidth || 0}
                min={0}
                onChange={(e) => handleStyleChange('outlineWidth', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>{t('Spacing')}</label>
              <input
                type="number"
                value={currentStyles.outlinePad || 0}
                min={0}
                onChange={(e) => handleStyleChange('outlinePad', parseInt(e.target.value) || 0)}
              />
            </div>
          </CollapsibleSection>}

          {/* Blend mode */}
          {isSectionVisible('blendMode', component.type) && (
          <div className="property-row" style={{ marginTop: 10 }}>
            <label>{t('Blend mode')}</label>
            <select
              value={currentStyles.blendMode || 'normal'}
              onChange={(e) => handleStyleChange('blendMode', e.target.value as StyleProps['blendMode'])}
              style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
            >
              <option value="normal">{t('Normal')}</option>
              <option value="additive">{t('Additive')}</option>
              <option value="subtractive">{t('Subtractive')}</option>
              <option value="multiply">{t('Multiply')}</option>
            </select>
          </div>
          )}
        </div>

        {/* Component-specific props */}
        {renderComponentProps(component, handlePropsChange, handleBatchPropsChange)}

        {/* Flex/Grid child properties */}
        {parentLayout === 'flex' && (
          <div className="property-section">
            <div className="section-header">{t('Flex item')}</div>
            <div className="property-row">
              <label>flexGrow</label>
              <input
                type="number"
                value={component.props.flexGrow ?? 0}
                min={0}
                max={10}
                onChange={(e) => handlePropsChange('flexGrow', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>flexShrink</label>
              <input
                type="number"
                value={component.props.flexShrink ?? 1}
                min={0}
                max={10}
                onChange={(e) => handlePropsChange('flexShrink', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>alignSelf</label>
              <select
                value={component.props.alignSelf || 'auto'}
                onChange={(e) => handlePropsChange('alignSelf', e.target.value)}
              >
                <option value="auto">{t('Auto')}</option>
                <option value="flex-start">{t('Start')}</option>
                <option value="flex-end">{t('End')}</option>
                <option value="center">{t('Center')}</option>
                <option value="stretch">{t('Stretch')}</option>
              </select>
            </div>
          </div>
        )}

        {parentLayout === 'grid' && (
          <div className="property-section">
            <div className="section-header">{t('Grid item')}</div>
            <div className="property-row two-col">
              <div className="property-field">
                <label>{t('Start column')}</label>
                <input
                  type="number"
                  value={component.props.gridColumn ?? 0}
                  min={0}
                  onChange={(e) => handlePropsChange('gridColumn', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="property-field">
                <label>{t('Column span')}</label>
                <input
                  type="number"
                  value={component.props.gridColumnSpan ?? 1}
                  min={1}
                  onChange={(e) => handlePropsChange('gridColumnSpan', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
            <div className="property-row two-col">
              <div className="property-field">
                <label>{t('Start row')}</label>
                <input
                  type="number"
                  value={component.props.gridRow ?? 0}
                  min={0}
                  onChange={(e) => handlePropsChange('gridRow', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="property-field">
                <label>{t('Row span')}</label>
                <input
                  type="number"
                  value={component.props.gridRowSpan ?? 1}
                  min={1}
                  onChange={(e) => handlePropsChange('gridRowSpan', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
            <div className="property-row">
              <label>{t('Horizontal align')}</label>
              <select
                value={component.props.gridCellAlignX || 'stretch'}
                onChange={(e) => handlePropsChange('gridCellAlignX', e.target.value)}
              >
                <option value="start">{t('Start')}</option>
                <option value="center">{t('Center')}</option>
                <option value="end">{t('End')}</option>
                <option value="stretch">{t('Stretch')}</option>
              </select>
            </div>
            <div className="property-row">
              <label>{t('Vertical align')}</label>
              <select
                value={component.props.gridCellAlignY || 'stretch'}
                onChange={(e) => handlePropsChange('gridCellAlignY', e.target.value)}
              >
                <option value="start">{t('Start')}</option>
                <option value="center">{t('Center')}</option>
                <option value="end">{t('End')}</option>
                <option value="stretch">{t('Stretch')}</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Render flags section with grouped checkboxes
function renderFlagsSection(
  component: LvglComponent,
  handlePropertyChange: (property: keyof LvglComponent, value: LvglComponent[keyof LvglComponent]) => void
): React.ReactNode {
  const flags = component.flags || {};
  const isContainer = CONTAINER_TYPES.has(component.type);

  const handleFlagChange = (flagKey: keyof LvglFlags, checked: boolean) => {
    handlePropertyChange('flags', { ...flags, [flagKey]: checked });
  };

  const FLAG_GROUPS: { label: string; items: { key: keyof LvglFlags; label: string }[] }[] = [
    {
      label: t('Interaction'),
      items: [
        { key: 'clickable', label: t('Clickable') },
        { key: 'checkable', label: t('Checkable') },
        { key: 'disabled', label: t('Disabled') },
      ],
    },
    {
      label: t('Scroll'),
      items: [
        { key: 'scrollable', label: t('Scrollable') },
        { key: 'scrollElastic', label: t('Elastic scroll') },
        { key: 'scrollMomentum', label: t('Momentum scroll') },
        { key: 'scrollOnFocus', label: t('Scroll on focus') },
      ],
    },
    {
      label: t('Behavior'),
      items: [
        { key: 'hidden', label: t('Hide') },
        { key: 'snappable', label: t('Snappable') },
        { key: 'pressLock', label: t('Press lock') },
        { key: 'eventBubble', label: t('Event bubble') },
        { key: 'gesturesBubble', label: t('Gesture bubble') },
      ],
    },
  ];

  return (
    <>
      {FLAG_GROUPS.map((group) => {
        // Filter scroll flags for non-container types
        const items = isContainer ? group.items : group.items.filter(item => !SCROLL_FLAGS.has(item.key));
        if (items.length === 0) return null;
        return (
          <div key={group.label} className="flags-group">
            <div className="flags-group-label">{group.label}</div>
            {items.map((item) => (
              <div key={item.key} className="flag-row">
                <input
                  type="checkbox"
                  id={`flag-${item.key}`}
                  checked={!!flags[item.key]}
                  onChange={(e) => handleFlagChange(item.key, e.target.checked)}
                />
                <label htmlFor={`flag-${item.key}`}>{item.label}</label>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

// Font selector with resource store integration
function FontSelector({
  currentStyles,
  handleStyleChange,
}: {
  currentStyles: StyleProps;
  handleStyleChange: (key: keyof StyleProps, value: StyleProps[keyof StyleProps]) => void;
}): React.ReactNode {
  const fonts = useResourceStore((s) => s.fonts);

  return (
    <div className="property-row">
      <label>{t('Font')}</label>
      <select
        value={currentStyles.textFont || ''}
        onChange={(e) => handleStyleChange('textFont', e.target.value || undefined)}
        style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
      >
        <option value="">{t('Default')}</option>
        <optgroup label={t('Built-in fonts')}>
          {BUILTIN_FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </optgroup>
        {fonts.length > 0 && (
          <optgroup label={t('Uploaded fonts')}>
            {fonts.map((f) => (
              <option key={f.id} value={f.cFontName}>{f.name} ({f.family})</option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

// Built-in font sizes (matching montserrat available sizes)
const BUILTIN_FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48];

// Font selector for component props (fontResource + fontSize)
function ComponentFontSelector({
  fontResource,
  fontSize,
  onChange,
  onBatchChange,
}: {
  fontResource?: string;
  fontSize?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBatchChange?: (updates: Record<string, any>) => void;
}): React.ReactNode {
  const fonts = useResourceStore((s) => s.fonts);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const getProjectConfig = useProjectStore((s) => s.getProjectConfig);
  const [projectDefaultFont, setProjectDefaultFont] = useState<string | undefined>();
  const [projectDefaultFontSize, setProjectDefaultFontSize] = useState<number | undefined>();

  useEffect(() => {
    if (!currentProjectId) return;
    getProjectConfig(currentProjectId).then(cfg => {
      if (cfg) {
        setProjectDefaultFont(cfg.lvglConfig.defaultFont);
        setProjectDefaultFontSize(cfg.lvglConfig.defaultFontSize);
      }
    });
  }, [currentProjectId, getProjectConfig]);

  // Determine current selection value
  const currentValue = fontResource || '';

  // Determine if the effective font is a builtin font (size selector should be hidden)
  const isBuiltinFont = (name: string) => /^montserrat_\d+$/.test(name);

  // Resolve the effective font: explicit selection or project default
  const effectiveFont = fontResource || projectDefaultFont || '';
  const effectiveIsBuiltin = isBuiltinFont(effectiveFont);

  // For custom fonts, show the full BUILTIN_FONT_SIZES list instead of FontResource.sizes
  const selectedCustomFont = fontResource
    ? fonts.find((f) => f.cFontName === fontResource)
    : undefined;
  const defaultCustomFont = !fontResource && projectDefaultFont
    ? fonts.find((f) => f.cFontName === projectDefaultFont)
    : undefined;
  const activeCustomFont = selectedCustomFont || defaultCustomFont;
  const availableSizes = activeCustomFont ? BUILTIN_FONT_SIZES : [];

  // When font changes, adjust fontSize if needed
  const handleFontChange = (value: string) => {
    if (!value) {
      // "Default" selected - clear fontResource; keep fontSize only if default is custom and size differs
      const defaultIsCustom = projectDefaultFont && !isBuiltinFont(projectDefaultFont);
      if (defaultIsCustom && fontSize !== undefined && fontSize !== (projectDefaultFontSize || 16)) {
        // Keep fontSize to indicate this component uses default font but at a different size
        if (onBatchChange) {
          onBatchChange({ fontResource: undefined, fontSize });
        } else {
          onChange('fontResource', undefined);
        }
      } else {
        // Clear both
        if (onBatchChange) {
          onBatchChange({ fontResource: undefined, fontSize: undefined });
        } else {
          onChange('fontResource', undefined);
          onChange('fontSize', undefined);
        }
      }
    } else {
      const customFont = fonts.find((f) => f.cFontName === value);
      if (customFont) {
        // Custom font: keep current fontSize if it's in BUILTIN_FONT_SIZES, otherwise pick closest
        const curSize = fontSize || 16;
        let newSize = curSize;
        if (!BUILTIN_FONT_SIZES.includes(curSize)) {
          newSize = BUILTIN_FONT_SIZES.reduce((a, b) =>
            Math.abs(b - curSize) < Math.abs(a - curSize) ? b : a
          );
        }
        if (onBatchChange) {
          onBatchChange({ fontResource: value, fontSize: newSize });
        } else {
          onChange('fontResource', value);
          onChange('fontSize', newSize);
        }
      } else {
        // Built-in font selected - set fontResource to builtin name, extract size
        const match = value.match(/^montserrat_(\d+)$/);
        if (match) {
          if (onBatchChange) {
            onBatchChange({ fontResource: value, fontSize: parseInt(match[1]) });
          } else {
            onChange('fontResource', value);
            onChange('fontSize', parseInt(match[1]));
          }
        }
      }
    }
  };

  // Show size selector only when the effective font is a custom font
  const showSizeSelector = !effectiveIsBuiltin && availableSizes.length > 0;

  return (
    <>
      <div className="property-row">
        <label>{t('Font')}</label>
        <select
          value={currentValue}
          onChange={(e) => handleFontChange(e.target.value)}
          style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
        >
          <option value="">{t('Default')}</option>
          <optgroup label={t('Built-in fonts')}>
            {BUILTIN_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </optgroup>
          {fonts.length > 0 && (
            <optgroup label={t('Uploaded fonts')}>
              {fonts.map((f) => (
                <option key={f.id} value={f.cFontName}>{f.name} ({f.family})</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      {showSizeSelector && (
        <div className="property-row">
          <label>{t('Font size')}</label>
          <select
            value={availableSizes.includes(fontSize || 14) ? (fontSize || 14) : 'custom'}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== 'custom') onChange('fontSize', parseInt(v));
            }}
            style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
          >
            {availableSizes.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
            {!availableSizes.includes(fontSize || 14) && (
              <option value="custom">{fontSize || 14}{t('px (custom)')}</option>
            )}
          </select>
        </div>
      )}
    </>
  );
}

// Container layout properties editor
function ContainerLayoutEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  return (
    <div className="property-section">
      <div className="section-header">{t('Container layout')}</div>
      <div className="property-row">
        <label>{t('Scroll direction')}</label>
        <select
          value={props.scrollDir || 'none'}
          onChange={(e) => onChange('scrollDir', e.target.value)}
        >
          <option value="none">{t('No scroll')}</option>
          <option value="hor">{t('Horizontal')}</option>
          <option value="ver">{t('Vertical')}</option>
          <option value="all">{t('All directions')}</option>
        </select>
      </div>
      <div className="property-row">
        <label>{t('Layout mode')}</label>
        <select
          value={props.layout || 'none'}
          onChange={(e) => onChange('layout', e.target.value)}
        >
          <option value="none">{t('None')}</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
        </select>
      </div>
      {props.layout === 'flex' && (
        <>
          <div className="property-row">
            <label>{t('Direction')}</label>
            <select
              value={props.flexDirection || 'row'}
              onChange={(e) => onChange('flexDirection', e.target.value)}
            >
              <option value="row">{t('Horizontal')}</option>
              <option value="column">{t('Vertical')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Spacing')}</label>
            <input
              type="number"
              value={props.gap || 0}
              min={0}
              onChange={(e) => onChange('gap', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="property-row">
            <label>{t('Wrap')}</label>
            <select
              value={props.flexWrap || 'nowrap'}
              onChange={(e) => onChange('flexWrap', e.target.value)}
            >
              <option value="nowrap">{t('No wrap')}</option>
              <option value="wrap">{t('Wrap')}</option>
              <option value="wrap-reverse">{t('Reverse wrap')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Main axis align')}</label>
            <select
              value={props.justifyContent || 'flex-start'}
              onChange={(e) => onChange('justifyContent', e.target.value)}
            >
              <option value="flex-start">{t('Start')}</option>
              <option value="flex-end">{t('End')}</option>
              <option value="center">{t('Center')}</option>
              <option value="space-between">{t('Space between')}</option>
              <option value="space-around">{t('Space around')}</option>
              <option value="space-evenly">{t('Space evenly')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Cross axis align')}</label>
            <select
              value={props.alignItems || 'flex-start'}
              onChange={(e) => onChange('alignItems', e.target.value)}
            >
              <option value="flex-start">{t('Start')}</option>
              <option value="flex-end">{t('End')}</option>
              <option value="center">{t('Center')}</option>
              <option value="stretch">{t('Stretch')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Track align')}</label>
            <select
              value={props.alignContent || 'flex-start'}
              onChange={(e) => onChange('alignContent', e.target.value)}
            >
              <option value="flex-start">{t('Start')}</option>
              <option value="flex-end">{t('End')}</option>
              <option value="center">{t('Center')}</option>
              <option value="stretch">{t('Stretch')}</option>
              <option value="space-between">{t('Space between')}</option>
              <option value="space-around">{t('Space around')}</option>
            </select>
          </div>
        </>
      )}
      {props.layout === 'grid' && (
        <>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Column definitions')}</label>
            <input
              type="text"
              value={props.gridColumns || '1fr 1fr 1fr'}
              onChange={(e) => onChange('gridColumns', e.target.value)}
              placeholder={t('e.g. 1fr 2fr 1fr')}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <GridTemplatePreview value={props.gridColumns || '1fr 1fr 1fr'} />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Row definitions')}</label>
            <input
              type="text"
              value={props.gridRows || '1fr 1fr'}
              onChange={(e) => onChange('gridRows', e.target.value)}
              placeholder={t('e.g. 1fr 2fr')}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <GridTemplatePreview value={props.gridRows || '1fr 1fr'} />
          </div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Column gap')}</label>
              <input
                type="number"
                value={props.gridColumnGap || 0}
                min={0}
                onChange={(e) => onChange('gridColumnGap', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>{t('Line spacing')}</label>
              <input
                type="number"
                value={props.gridRowGap || 0}
                min={0}
                onChange={(e) => onChange('gridRowGap', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Render component-specific properties
function renderComponentProps(
  component: LvglComponent,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBatchChange?: (updates: Record<string, any>) => void
): React.ReactNode {
  const { type, props } = component;

  switch (type) {
    case 'btn':
      return (
        <>
          <div className="property-section">
            <div className="section-header">{t('Button')}</div>
            <div className="property-row">
              <label>{t('Text')}</label>
              <input
                type="text"
                value={props.text || ''}
                onChange={(e) => onChange('text', e.target.value)}
              />
            </div>
            <ComponentFontSelector
              fontResource={props.fontResource}
              fontSize={props.fontSize}
              onChange={onChange}
              onBatchChange={onBatchChange}
            />
            <div className="property-row">
              <label>{t('Text align')}</label>
              <select
                value={props.textAlign || 'center'}
                onChange={(e) => onChange('textAlign', e.target.value)}
              >
                <option value="left">{t('Align left')}</option>
                <option value="center">{t('Center')}</option>
                <option value="right">{t('Align right')}</option>
              </select>
            </div>
          </div>
          <ContainerLayoutEditor props={props} onChange={onChange} />
        </>
      );

    case 'label':
      return (
        <div className="property-section">
          <div className="section-header">{t('Label')}</div>
          <div className="property-row">
            <label>{t('Text')}</label>
            <input
              type="text"
              value={props.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
            />
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Text align')}</label>
            <select
              value={props.textAlign || 'left'}
              onChange={(e) => onChange('textAlign', e.target.value)}
            >
              <option value="left">{t('Align left')}</option>
              <option value="center">{t('Center')}</option>
              <option value="right">{t('Align right')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Long text mode')}</label>
            <select
              value={props.longMode || 'wrap'}
              onChange={(e) => onChange('longMode', e.target.value)}
            >
              <option value="wrap">{t('Wrap')}</option>
              <option value="scroll">{t('Scroll')}</option>
              <option value="dot">{t('Ellipsis')}</option>
              <option value="clip">{t('Clip')}</option>
            </select>
          </div>
        </div>
      );

    case 'textarea':
      return (
        <div className="property-section">
          <div className="section-header">{t('Textarea')}</div>
          <div className="property-row">
            <label>{t('Content')}</label>
            <textarea
              value={props.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
          <div className="property-row">
            <label>{t('Placeholder')}</label>
            <input
              type="text"
              value={props.placeholder || ''}
              onChange={(e) => onChange('placeholder', e.target.value)}
            />
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Max length')}</label>
            <input
              type="number"
              value={props.maxLength || 0}
              min={0}
              onChange={(e) => onChange('maxLength', parseInt(e.target.value) || 0)}
              style={{ flex: 1 }}
            />
            {(props.maxLength || 0) === 0 && <span style={{ fontSize: 11, color: '#999', marginLeft: 6, whiteSpace: 'nowrap' }}>{t('(unlimited)')}</span>}
          </div>
          <div className="property-row">
            <label>{t('Password mode')}</label>
            <input
              type="checkbox"
              checked={props.password || false}
              onChange={(e) => onChange('password', e.target.checked)}
            />
          </div>
          <div className="property-row">
            <label>{t('One-line mode')}</label>
            <input
              type="checkbox"
              checked={props.oneLine || false}
              onChange={(e) => onChange('oneLine', e.target.checked)}
            />
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div className="property-section">
          <div className="section-header">{t('Checkbox')}</div>
          <div className="property-row">
            <label>{t('Text')}</label>
            <input
              type="text"
              value={props.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
            />
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Checked')}</label>
            <input
              type="checkbox"
              checked={props.checked || false}
              onChange={(e) => onChange('checked', e.target.checked)}
            />
          </div>
        </div>
      );

    case 'switch':
      return (
        <div className="property-section">
          <div className="section-header">{t('Switch')}</div>
          <div className="property-row">
            <label>{t('On')}</label>
            <ToggleSwitch
              checked={props.checked || false}
              onChange={(checked) => onChange('checked', checked)}
            />
          </div>
        </div>
      );

    case 'slider':
      return (
        <div className="property-section">
          <div className="section-header">{t('Slider')}</div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Min')}</label>
              <input
                type="number"
                value={props.min ?? 0}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value) || 0;
                  onChange('min', newMin);
                  const curVal = props.value ?? 50;
                  const curMax = props.max ?? 100;
                  if (curVal < newMin) onChange('value', newMin);
                  if (curMax < newMin) onChange('max', newMin);
                }}
              />
            </div>
            <div className="property-field">
              <label>{t('Max')}</label>
              <input
                type="number"
                value={props.max ?? 100}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value) || 100;
                  onChange('max', newMax);
                  const curVal = props.value ?? 50;
                  const curMin = props.min ?? 0;
                  if (curVal > newMax) onChange('value', newMax);
                  if (curMin > newMax) onChange('min', newMax);
                }}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Current value')}</label>
            <div className="range-with-value">
              <input
                type="range"
                min={props.min ?? 0}
                max={props.max ?? 100}
                step={props.step || 1}
                value={props.value ?? 50}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                className="range-number-input"
                value={props.value ?? 50}
                min={props.min ?? 0}
                max={props.max ?? 100}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Step')}</label>
            <input
              type="number"
              value={props.step || 1}
              min={1}
              onChange={(e) => onChange('step', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="property-row">
            <label>{t('Direction')}</label>
            <select
              value={props.orientation || 'horizontal'}
              onChange={(e) => onChange('orientation', e.target.value)}
            >
              <option value="horizontal">{t('Horizontal')}</option>
              <option value="vertical">{t('Vertical')}</option>
            </select>
          </div>
        </div>
      );

    case 'bar':
      return (
        <div className="property-section">
          <div className="section-header">{t('Progress bar')}</div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Min')}</label>
              <input
                type="number"
                value={props.min ?? 0}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value) || 0;
                  onChange('min', newMin);
                  const curVal = props.value ?? 50;
                  const curMax = props.max ?? 100;
                  if (curVal < newMin) onChange('value', newMin);
                  if (curMax < newMin) onChange('max', newMin);
                }}
              />
            </div>
            <div className="property-field">
              <label>{t('Max')}</label>
              <input
                type="number"
                value={props.max ?? 100}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value) || 100;
                  onChange('max', newMax);
                  const curVal = props.value ?? 50;
                  const curMin = props.min ?? 0;
                  if (curVal > newMax) onChange('value', newMax);
                  if (curMin > newMax) onChange('min', newMax);
                }}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Current value')}</label>
            <div className="range-with-value">
              <input
                type="range"
                min={props.min ?? 0}
                max={props.max ?? 100}
                value={props.value ?? 50}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                className="range-number-input"
                value={props.value ?? 50}
                min={props.min ?? 0}
                max={props.max ?? 100}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Direction')}</label>
            <select
              value={props.orientation || 'horizontal'}
              onChange={(e) => onChange('orientation', e.target.value)}
            >
              <option value="horizontal">{t('Horizontal')}</option>
              <option value="vertical">{t('Vertical')}</option>
            </select>
          </div>
        </div>
      );

    case 'win':
      return <WindowEditor props={props} onChange={onChange} />;

    case 'table':
      return <TableEditor props={props} onChange={onChange} />;

    case 'img':
      return <ImagePropsEditor props={props} onChange={onChange} />;

    case 'line':
      return <LineEditor props={props} onChange={onChange} />;

    case 'dropdown':
      return (
        <div className="property-section">
          <div className="section-header">{t('Dropdown')}</div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <label>{t('Options')}</label>
            <DropdownOptionsEditor
              options={props.options || ['Option 1', 'Option 2', 'Option 3']}
              onChange={(newOptions) => onChange('options', newOptions)}
            />
          </div>
          <div className="property-row">
            <label>{t('Default selected')}</label>
            <select
              value={props.selected || 0}
              onChange={(e) => onChange('selected', parseInt(e.target.value) || 0)}
            >
              {(props.options || ['Option 1', 'Option 2', 'Option 3']).map((opt: string, i: number) => (
                <option key={i} value={i}>{i}: {opt}</option>
              ))}
            </select>
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Open direction')}</label>
            <select
              value={props.direction || 'down'}
              onChange={(e) => onChange('direction', e.target.value)}
            >
              <option value="down">{t('Down')}</option>
              <option value="up">{t('Up')}</option>
            </select>
          </div>
        </div>
      );

    case 'arc':
      return (
        <div className="property-section">
          <div className="section-header">{t('Arc')}</div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Start angle:')} {props.startAngle || 135}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={props.startAngle || 135}
              onChange={(e) => onChange('startAngle', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('End angle:')} {props.endAngle || 45}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={props.endAngle || 45}
              onChange={(e) => onChange('endAngle', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Min')}</label>
              <input
                type="number"
                value={props.min || 0}
                onChange={(e) => onChange('min', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>{t('Max')}</label>
              <input
                type="number"
                value={props.max || 100}
                onChange={(e) => onChange('max', parseInt(e.target.value) || 100)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Current value')}</label>
            <div className="range-with-value">
              <input
                type="range"
                min={props.min || 0}
                max={props.max || 100}
                value={props.value || 0}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                className="range-number-input"
                value={props.value || 0}
                min={props.min || 0}
                max={props.max || 100}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Mode')}</label>
            <select
              value={props.mode || 'normal'}
              onChange={(e) => onChange('mode', e.target.value)}
            >
              <option value="normal">{t('Normal mode')}</option>
              <option value="symmetrical">{t('Symmetrical')}</option>
              <option value="reverse">{t('Reverse')}</option>
            </select>
          </div>
        </div>
      );

    case 'spinner':
      return (
        <div className="property-section">
          <div className="section-header">{t('Spinner')}</div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Spin speed:')} {props.speed || 1000}ms</label>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={props.speed || 1000}
              onChange={(e) => onChange('speed', parseInt(e.target.value) || 1000)}
            />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Arc length:')} {props.arcLength || 60}°</label>
            <input
              type="range"
              min={10}
              max={360}
              value={props.arcLength || 60}
              onChange={(e) => onChange('arcLength', parseInt(e.target.value) || 60)}
            />
          </div>
        </div>
      );

    case 'chart':
      return <ChartSeriesEditor props={props} onChange={onChange} />;

    case 'calendar':
      return <CalendarEditor props={props} onChange={onChange} />;

    case 'tabview':
      return <TabManager props={props} onChange={onChange} />;

    case 'tileview':
      return <TileGridEditor props={props} onChange={onChange} />;

    case 'obj':
      return <ContainerLayoutEditor props={props} onChange={onChange} />;

    default:
      return null;
  }
}

// Image props editor with resource picker
function ImagePropsEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const images = useResourceStore((s) => s.images);
  const [showDropdown, setShowDropdown] = useState(false);

  // Find the currently selected resource image (match by id or name)
  const selectedImage = images.find(
    (img) => img.id === props.src || img.name === props.src
  );

  const handleSelectImage = (imageId: string) => {
    setShowDropdown(false);
    onChange('src', imageId);
  };

  const handleClear = () => {
    onChange('src', '');
    setShowDropdown(false);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Image')}</div>
      <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
        <label>{t('Image source')}</label>
        <div className="image-src-picker">
          <div
            className="image-src-display"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {selectedImage ? (
              <>
                <img
                  src={selectedImage.data}
                  alt={selectedImage.name}
                  className="image-src-thumb"
                />
                <span className="image-src-name">{selectedImage.name}</span>
              </>
            ) : props.src ? (
              <span className="image-src-name" style={{ color: '#999' }}>{props.src}</span>
            ) : (
              <span className="image-src-placeholder">{t('Select an image resource...')}</span>
            )}
            <span className="image-src-arrow"><Emoji c="▼" /></span>
          </div>
          {showDropdown && (
            <div className="image-src-dropdown">
              {images.length === 0 ? (
                <div className="image-src-empty">{t('No image resources; upload one in the resource manager first')}</div>
              ) : (
                <>
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`image-src-option ${img.id === props.src ? 'selected' : ''}`}
                      onClick={() => handleSelectImage(img.id)}
                    >
                      <img src={img.data} alt={img.name} className="image-src-option-thumb" />
                      <div className="image-src-option-info">
                        <span className="image-src-option-name">{img.name}</span>
                        <span className="image-src-option-size">{img.width}×{img.height}</span>
                      </div>
                    </div>
                  ))}
                  {props.src && (
                    <div className="image-src-option clear-option" onClick={handleClear}>
                      {t('Clear selection')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <input
          type="text"
          value={props.src || ''}
          onChange={(e) => onChange('src', e.target.value)}
          placeholder={t('Or enter an image ID / URL manually')}
          style={{ fontSize: 11, color: '#888' }}
        />
      </div>
      <div className="property-row">
        <label>{t('Scale mode')}</label>
        <select
          value={props.scaleMode || 'none'}
          onChange={(e) => onChange('scaleMode', e.target.value)}
        >
          <option value="none">{t('Original')}</option>
          <option value="cover">{t('Cover')}</option>
          <option value="contain">{t('Contain')}</option>
        </select>
      </div>
      <div className="property-row">
        <label>{t('Rotation angle')}</label>
        <input
          type="number"
          value={props.rotation || 0}
          min={0}
          max={360}
          onChange={(e) => onChange('rotation', parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

// Table editor component
function TableEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const rows: number = props.rows ?? 3;
  const cols: number = props.cols ?? 3;
  const cellData: string[][] = props.cellData || Array.from({ length: rows }, () => Array(cols).fill(''));
  const cellAligns: string[][] = props.cellAligns || Array.from({ length: rows }, () => Array(cols).fill('left'));
  const columnWidths: number[] = props.columnWidths || Array(cols).fill(60);
  const headerRow: boolean = props.headerRow ?? true;

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  // Ensure arrays match current rows/cols dimensions
  const ensureSize = (data: string[][], r: number, c: number, fill: string): string[][] => {
    const result: string[][] = [];
    for (let i = 0; i < r; i++) {
      const row: string[] = [];
      for (let j = 0; j < c; j++) {
        row.push(data[i]?.[j] ?? fill);
      }
      result.push(row);
    }
    return result;
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = cellData.map(row => [...row]);
    if (!newData[r]) newData[r] = Array(cols).fill('');
    newData[r][c] = value;
    onChange('cellData', newData);
  };

  const handleCellAlignChange = (align: string) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    const newAligns = cellAligns.map(row => [...row]);
    if (!newAligns[r]) newAligns[r] = Array(cols).fill('left');
    newAligns[r][c] = align;
    onChange('cellAligns', newAligns);
  };

  const handleColWidthChange = (c: number, value: number) => {
    const newWidths = [...columnWidths];
    newWidths[c] = Math.max(20, value);
    onChange('columnWidths', newWidths);
  };

  const handleRowsChange = (newRows: number) => {
    if (newRows < 1) return;
    const newData = ensureSize(cellData, newRows, cols, '');
    const newAligns = ensureSize(cellAligns, newRows, cols, 'left');
    onChange('rows', newRows);
    onChange('cellData', newData);
    onChange('cellAligns', newAligns);
  };

  const handleColsChange = (newCols: number) => {
    if (newCols < 1) return;
    const newData = ensureSize(cellData, rows, newCols, '');
    const newAligns = ensureSize(cellAligns, rows, newCols, 'left');
    const newWidths: number[] = [];
    for (let j = 0; j < newCols; j++) {
      newWidths.push(columnWidths[j] ?? 60);
    }
    onChange('cols', newCols);
    onChange('cellData', newData);
    onChange('cellAligns', newAligns);
    onChange('columnWidths', newWidths);
  };

  const addRow = () => handleRowsChange(rows + 1);
  const addCol = () => handleColsChange(cols + 1);
  const deleteRow = () => { if (rows > 1) handleRowsChange(rows - 1); };
  const deleteCol = () => { if (cols > 1) handleColsChange(cols - 1); };

  return (
    <div className="property-section">
      <div className="section-header">{t('Table')}</div>
      <div className="property-row">
        <label>{t('Header row')}</label>
        <input
          type="checkbox"
          checked={headerRow}
          onChange={(e) => onChange('headerRow', e.target.checked)}
        />
      </div>
      <div className="table-editor-actions">
        <button onClick={addRow} title={t('Add row')}>{t('+ Row')}</button>
        <button onClick={addCol} title={t('Add column')}>{t('+ Column')}</button>
        <button onClick={deleteRow} title={t('Delete last row')} disabled={rows <= 1}>{t('- Row')}</button>
        <button onClick={deleteCol} title={t('Delete last column')} disabled={cols <= 1}>{t('- Column')}</button>
      </div>
      {selectedCell && (
        <div className="table-cell-align-bar">
          <span className="table-cell-align-label">{t('Cell align:')}</span>
          {(['left', 'center', 'right'] as const).map(a => (
            <button
              key={a}
              className={`table-align-btn ${cellAligns[selectedCell[0]]?.[selectedCell[1]] === a ? 'active' : ''}`}
              onClick={() => handleCellAlignChange(a)}
              title={a === 'left' ? t('Align left') : a === 'center' ? t('Center') : t('Align right')}
            >
              {a === 'left' ? '⫷' : a === 'center' ? '⫿' : '⫸'}
            </button>
          ))}
        </div>
      )}
      <div className="table-editor-wrapper">
        <table className="table-editor-table">
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} className={r === 0 && headerRow ? 'table-header-row' : ''}>
                {Array.from({ length: cols }, (_, c) => (
                  <td
                    key={c}
                    className={`table-editor-cell ${selectedCell?.[0] === r && selectedCell?.[1] === c ? 'selected' : ''}`}
                    style={{ textAlign: (cellAligns[r]?.[c] || 'left') as React.CSSProperties['textAlign'] }}
                    onClick={() => setSelectedCell([r, c])}
                  >
                    <input
                      type="text"
                      className="table-cell-input"
                      value={cellData[r]?.[c] ?? ''}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      onFocus={() => setSelectedCell([r, c])}
                      style={{ textAlign: (cellAligns[r]?.[c] || 'left') as React.CSSProperties['textAlign'] }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CollapsibleSection title={t('Column width settings')}>
        {Array.from({ length: cols }, (_, c) => (
          <div key={c} className="property-row">
            <label>{t('Column')} {c + 1}</label>
            <input
              type="number"
              value={columnWidths[c] ?? 60}
              min={20}
              onChange={(e) => handleColWidthChange(c, parseInt(e.target.value) || 60)}
            />
          </div>
        ))}
      </CollapsibleSection>
    </div>
  );
}

// Window editor component
function WindowEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const headerButtons: Array<{ icon: string; id: string }> = props.headerButtons || [];

  const ICON_OPTIONS = ['✕', '☰', '⚙', '←', '→', '↑', '↓', '⟳', '⊕', '⊖'];

  const addHeaderButton = () => {
    const newBtn = { icon: '✕', id: `btn_${Date.now()}` };
    onChange('headerButtons', [...headerButtons, newBtn]);
  };

  const removeHeaderButton = (index: number) => {
    const newBtns = headerButtons.filter((_, i) => i !== index);
    onChange('headerButtons', newBtns);
  };

  const updateHeaderButton = (index: number, field: 'icon' | 'id', value: string) => {
    const newBtns = headerButtons.map((btn, i) =>
      i === index ? { ...btn, [field]: value } : btn
    );
    onChange('headerButtons', newBtns);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Window')}</div>
      <div className="property-row">
        <label>{t('Title')}</label>
        <input
          type="text"
          value={props.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div className="property-row">
        <label>{t('Title bar height')}</label>
        <input
          type="number"
          value={props.headerHeight ?? 40}
          min={20}
          max={80}
          onChange={(e) => onChange('headerHeight', parseInt(e.target.value) || 40)}
        />
      </div>
      <div className="property-row">
        <label>{t('Close button')}</label>
        <input
          type="checkbox"
          checked={props.showCloseBtn !== false}
          onChange={(e) => onChange('showCloseBtn', e.target.checked)}
        />
      </div>
      <CollapsibleSection title={t('Title bar buttons')}>
        <div className="win-btn-list">
          {headerButtons.map((btn, i) => (
            <div key={i} className="win-btn-item">
              <select
                value={btn.icon}
                onChange={(e) => updateHeaderButton(i, 'icon', e.target.value)}
                className="win-btn-icon-select"
              >
                {ICON_OPTIONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <input
                type="text"
                value={btn.id}
                onChange={(e) => updateHeaderButton(i, 'id', e.target.value)}
                placeholder={t('Button ID')}
                className="win-btn-id-input"
              />
              <button className="win-btn-delete" onClick={() => removeHeaderButton(i)} title={t('Delete')}><Emoji c="✕" /></button>
            </div>
          ))}
          <button className="win-btn-add" onClick={addHeaderButton}>{t('+ Add button')}</button>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// Chart series editor component
function ChartSeriesEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  // Backward compat: migrate old data field to series
  const series: Array<{ name: string; data: number[]; color: string; lineWidth?: number; pointSize?: number }> =
    props.series || (props.data ? [{ name: t('Series') + ' 1', data: props.data, color: props.lineColor || '#2196F3', lineWidth: 2, pointSize: 4 }] : [{ name: t('Series') + ' 1', data: [10, 20, 30, 25, 40], color: '#2196F3', lineWidth: 2, pointSize: 4 }]);

  const [expandedSeries, setExpandedSeries] = useState<number | null>(0);

  const updateSeries = (index: number, field: string, value: unknown) => {
    const newSeries = series.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange('series', newSeries);
  };

  const addSeries = () => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
    const color = colors[series.length % colors.length];
    onChange('series', [...series, { name: `${t('Series')} ${series.length + 1}`, data: [0, 0, 0], color, lineWidth: 2, pointSize: 4 }]);
    setExpandedSeries(series.length);
  };

  const removeSeries = (index: number) => {
    if (series.length <= 1) return;
    const newSeries = series.filter((_, i) => i !== index);
    onChange('series', newSeries);
    if (expandedSeries === index) setExpandedSeries(null);
    else if (expandedSeries !== null && expandedSeries > index) setExpandedSeries(expandedSeries - 1);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Chart')}</div>
      <div className="property-row">
        <label>{t('Type')}</label>
        <select
          value={props.type || 'line'}
          onChange={(e) => onChange('type', e.target.value)}
        >
          <option value="line">{t('Line chart')}</option>
          <option value="bar">{t('Bar chart')}</option>
          <option value="scatter">{t('Scatter chart')}</option>
        </select>
      </div>

      <div className="chart-series-list">
        <div className="chart-series-header">
          <span>{t('Data series (')}{series.length})</span>
          <button className="chart-series-add-btn" onClick={addSeries}>{t('+ Add')}</button>
        </div>
        {series.map((s, i) => (
          <div key={i} className="chart-series-item">
            <div
              className={`chart-series-row ${expandedSeries === i ? 'expanded' : ''}`}
              onClick={() => setExpandedSeries(expandedSeries === i ? null : i)}
            >
              <span className="chart-series-color-dot" style={{ backgroundColor: s.color }} />
              <span className="chart-series-name">{s.name}</span>
              <span className="chart-series-count">{s.data.length}{t('points')}</span>
              {series.length > 1 && (
                <button
                  className="chart-series-delete"
                  onClick={(e) => { e.stopPropagation(); removeSeries(i); }}
                  title={t('Delete series')}
                ><Emoji c="✕" /></button>
              )}
            </div>
            {expandedSeries === i && (
              <div className="chart-series-detail">
                <div className="property-row">
                  <label>{t('Name')}</label>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSeries(i, 'name', e.target.value)}
                  />
                </div>
                <div className="property-row">
                  <label>{t('Color')}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) => updateSeries(i, 'color', e.target.value)}
                    />
                    <input
                      type="text"
                      value={s.color}
                      onChange={(e) => updateSeries(i, 'color', e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
                <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <label>{t('Data points')}</label>
                  <input
                    type="text"
                    value={s.data.join(', ')}
                    onChange={(e) => updateSeries(i, 'data', e.target.value.split(',').map((v: string) => parseInt(v.trim()) || 0))}
                    placeholder="10, 20, 30, 40"
                  />
                </div>
                <div className="property-row two-col">
                  <div className="property-field">
                    <label>{t('Line width')}</label>
                    <input
                      type="number"
                      value={s.lineWidth ?? 2}
                      min={1}
                      max={10}
                      onChange={(e) => updateSeries(i, 'lineWidth', parseInt(e.target.value) || 2)}
                    />
                  </div>
                  <div className="property-field">
                    <label>{t('Point size')}</label>
                    <input
                      type="number"
                      value={s.pointSize ?? 4}
                      min={0}
                      max={20}
                      onChange={(e) => updateSeries(i, 'pointSize', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Y axis min')}</label>
          <input
            type="number"
            value={props.yAxisMin ?? 0}
            onChange={(e) => onChange('yAxisMin', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="property-field">
          <label>{t('Y axis max')}</label>
          <input
            type="number"
            value={props.yAxisMax ?? 100}
            onChange={(e) => onChange('yAxisMax', parseInt(e.target.value) || 100)}
          />
        </div>
      </div>
      <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        <label>{t('X axis labels')}</label>
        <input
          type="text"
          value={(props.xLabels || []).join(', ')}
          onChange={(e) => onChange('xLabels', e.target.value.split(',').map((v: string) => v.trim()).filter(Boolean))}
          placeholder={t('Label 1, Label 2, ...')}
        />
      </div>
      <div className="property-row">
        <label>{t('Show legend')}</label>
        <input
          type="checkbox"
          checked={props.showLegend || false}
          onChange={(e) => onChange('showLegend', e.target.checked)}
        />
      </div>
      <div className="property-row">
        <label>{t('Show grid')}</label>
        <input
          type="checkbox"
          checked={props.showGrid !== false}
          onChange={(e) => onChange('showGrid', e.target.checked)}
        />
      </div>
    </div>
  );
}

// Calendar editor component
function CalendarEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const highlightedDates: string[] = props.highlightedDates || [];
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');

  const isValidDate = (str: string): boolean => {
    const match = str.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!match) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
  };

  const addDate = () => {
    const trimmed = dateInput.trim();
    if (!trimmed) return;
    if (!isValidDate(trimmed)) {
      setDateError(t('Invalid format, use YYYY-MM-DD'));
      return;
    }
    if (highlightedDates.includes(trimmed)) {
      setDateError(t('Date already exists'));
      return;
    }
    onChange('highlightedDates', [...highlightedDates, trimmed]);
    setDateInput('');
    setDateError('');
  };

  const removeDate = (date: string) => {
    onChange('highlightedDates', highlightedDates.filter(d => d !== date));
  };

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDate();
    }
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Calendar')}</div>
      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Year')}</label>
          <input
            type="number"
            value={props.year || new Date().getFullYear()}
            min={1970}
            max={2100}
            onChange={(e) => onChange('year', parseInt(e.target.value) || 2024)}
          />
        </div>
        <div className="property-field">
          <label>{t('Month')}</label>
          <input
            type="number"
            value={props.month || 1}
            min={1}
            max={12}
            onChange={(e) => onChange('month', Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        </div>
      </div>
      <div className="property-row">
        <label>{t('Show day names')}</label>
        <input
          type="checkbox"
          checked={props.showDayNames !== false}
          onChange={(e) => onChange('showDayNames', e.target.checked)}
        />
      </div>
      <div className="property-row">
        <label>{t('Today marker')}</label>
        <input
          type="checkbox"
          checked={props.showToday !== false}
          onChange={(e) => onChange('showToday', e.target.checked)}
        />
      </div>

      <CollapsibleSection title={t('Highlighted dates')} defaultOpen={highlightedDates.length > 0}>
        <div className="calendar-date-tags">
          {highlightedDates.map(date => (
            <span key={date} className="calendar-date-tag">
              {date}
              <button className="calendar-date-tag-remove" onClick={() => removeDate(date)}><Emoji c="✕" /></button>
            </span>
          ))}
        </div>
        <div className="calendar-date-input-row">
          <input
            type="text"
            value={dateInput}
            onChange={(e) => { setDateInput(e.target.value); setDateError(''); }}
            onKeyDown={handleDateKeyDown}
            placeholder="YYYY-MM-DD"
            className="calendar-date-input"
          />
          <button className="calendar-date-add-btn" onClick={addDate}>{t('Add')}</button>
        </div>
        {dateError && <span className="calendar-date-error">{dateError}</span>}
      </CollapsibleSection>

      <CollapsibleSection title={t('Date range')}>
        <div className="property-row">
          <label>{t('Range selection mode')}</label>
          <input
            type="checkbox"
            checked={props.dateRangeMode || false}
            onChange={(e) => onChange('dateRangeMode', e.target.checked)}
          />
        </div>
        {props.dateRangeMode && (
          <>
            <div className="property-row">
              <label>{t('Start date')}</label>
              <input
                type="date"
                value={props.rangeStart || ''}
                onChange={(e) => onChange('rangeStart', e.target.value)}
              />
            </div>
            <div className="property-row">
              <label>{t('End date')}</label>
              <input
                type="date"
                value={props.rangeEnd || ''}
                onChange={(e) => onChange('rangeEnd', e.target.value)}
              />
            </div>
          </>
        )}
      </CollapsibleSection>
    </div>
  );
}

// TabView tab manager component
function TabManager({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const tabs: string[] = props.tabs || ['Tab 1', 'Tab 2'];
  const activeTab: number = props.activeTab || 0;
  const tabChildMap: Record<string, string[]> = props.tabChildMap || {};

  const setActiveTab = (index: number) => {
    onChange('activeTab', index);
  };

  const renameTab = (index: number, name: string) => {
    const newTabs = tabs.map((t, i) => i === index ? name : t);
    onChange('tabs', newTabs);
  };

  const addTab = () => {
    onChange('tabs', [...tabs, `Tab ${tabs.length + 1}`]);
  };

  const removeTab = (index: number) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter((_, i) => i !== index);
    // Update tabChildMap keys
    const newMap: Record<string, string[]> = {};
    for (let i = 0; i < newTabs.length; i++) {
      const oldIndex = i >= index ? i + 1 : i;
      if (tabChildMap[String(oldIndex)]) {
        newMap[String(i)] = tabChildMap[String(oldIndex)];
      }
    }
    onChange('tabs', newTabs);
    onChange('tabChildMap', newMap);
    if (activeTab >= newTabs.length) {
      onChange('activeTab', newTabs.length - 1);
    }
  };

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabs.length) return;
    const newTabs = [...tabs];
    [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
    // Swap child map entries
    const newMap = { ...tabChildMap };
    const a = newMap[String(index)];
    const b = newMap[String(targetIndex)];
    if (a || b) {
      newMap[String(index)] = b || [];
      newMap[String(targetIndex)] = a || [];
    }
    onChange('tabs', newTabs);
    onChange('tabChildMap', newMap);
    if (activeTab === index) onChange('activeTab', targetIndex);
    else if (activeTab === targetIndex) onChange('activeTab', index);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Tab view')}</div>
      <div className="tab-manager-list">
        {tabs.map((tab, i) => (
          <div
            key={i}
            className={`tab-manager-item ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            <input
              type="text"
              value={tab}
              onChange={(e) => renameTab(i, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="tab-manager-name-input"
            />
            <span className="tab-manager-child-count">
              {(tabChildMap[String(i)] || []).length} {t('components')}
            </span>
            <div className="tab-manager-actions">
              <button
                className="tab-manager-move-btn"
                onClick={(e) => { e.stopPropagation(); moveTab(i, 'up'); }}
                disabled={i === 0}
                title={t('Move up')}
              ><Emoji c="↑" /></button>
              <button
                className="tab-manager-move-btn"
                onClick={(e) => { e.stopPropagation(); moveTab(i, 'down'); }}
                disabled={i === tabs.length - 1}
                title={t('Move down')}
              ><Emoji c="↓" /></button>
              {tabs.length > 1 && (
                <button
                  className="tab-manager-delete-btn"
                  onClick={(e) => { e.stopPropagation(); removeTab(i); }}
                  title={t('Delete')}
                ><Emoji c="✕" /></button>
              )}
            </div>
          </div>
        ))}
        <button className="tab-manager-add-btn" onClick={addTab}>{t('+ Add tab')}</button>
      </div>
      <div className="property-row">
        <label>{t('Tab position')}</label>
        <select
          value={props.tabPosition || 'top'}
          onChange={(e) => onChange('tabPosition', e.target.value)}
        >
          <option value="top">{t('Top')}</option>
          <option value="bottom">{t('Bottom')}</option>
          <option value="left">{t('Left')}</option>
          <option value="right">{t('Right')}</option>
        </select>
      </div>
      <div className="tab-manager-hint">{t('Dropped components are assigned to the active tab automatically')}</div>
    </div>
  );
}

// TileView grid editor component
function TileGridEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const rows: number = props.rows || 2;
  const cols: number = props.cols || 2;
  const currentRow: number = props.currentRow || 0;
  const currentCol: number = props.currentCol || 0;
  const tileChildMap: Record<string, string[]> = props.tileChildMap || {};

  const selectTile = (r: number, c: number) => {
    onChange('currentRow', r);
    onChange('currentCol', c);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Tile view')}</div>
      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Rows')}</label>
          <input
            type="number"
            value={rows}
            min={1}
            max={10}
            onChange={(e) => onChange('rows', Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="property-field">
          <label>{t('Columns')}</label>
          <input
            type="number"
            value={cols}
            min={1}
            max={10}
            onChange={(e) => onChange('cols', Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="tile-grid-visual">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="tile-grid-row">
            {Array.from({ length: cols }, (_, c) => {
              const key = `${r}-${c}`;
              const childCount = (tileChildMap[key] || []).length;
              const isActive = r === currentRow && c === currentCol;
              return (
                <div
                  key={c}
                  className={`tile-grid-cell ${isActive ? 'active' : ''}`}
                  onClick={() => selectTile(r, c)}
                  title={t('Tile [{0}, {1}] - {2} components', r, c, childCount)}
                >
                  <span className="tile-grid-cell-label">{childCount}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Current row')}</label>
          <input
            type="number"
            value={currentRow}
            min={0}
            max={rows - 1}
            onChange={(e) => onChange('currentRow', Math.min(rows - 1, Math.max(0, parseInt(e.target.value) || 0)))}
          />
        </div>
        <div className="property-field">
          <label>{t('Current column')}</label>
          <input
            type="number"
            value={currentCol}
            min={0}
            max={cols - 1}
            onChange={(e) => onChange('currentCol', Math.min(cols - 1, Math.max(0, parseInt(e.target.value) || 0)))}
          />
        </div>
      </div>
      <div className="tile-grid-hint">{t('Dropped components are assigned to the selected tile automatically')}</div>
    </div>
  );
}

// Font size input with preset dropdown + custom number
const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

function FontSizeInput({ value, onChange }: { value: number; onChange: (v: number) => void }): React.ReactNode {
  const isPreset = FONT_SIZE_PRESETS.includes(value);
  return (
    <div className="font-size-input">
      <select
        value={isPreset ? value : 'custom'}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'custom') return;
          onChange(parseInt(v));
        }}
        className="font-size-select"
      >
        {FONT_SIZE_PRESETS.map(s => (
          <option key={s} value={s}>{s}px</option>
        ))}
        {!isPreset && <option value="custom">{value}{t('px (custom)')}</option>}
      </select>
      <input
        type="number"
        className="font-size-number"
        value={value}
        min={6}
        max={128}
        onChange={(e) => onChange(Math.max(6, parseInt(e.target.value) || 14))}
      />
    </div>
  );
}

// Line editor with points list
function LineEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const points: number[][] = props.points || [[0, 0], [100, 0]];

  const updatePoint = (index: number, axis: 0 | 1, value: number) => {
    const newPoints = points.map((p, i) =>
      i === index ? (axis === 0 ? [value, p[1]] : [p[0], value]) : [...p]
    );
    onChange('points', newPoints);
  };

  const addPoint = () => {
    const last = points[points.length - 1] || [0, 0];
    onChange('points', [...points, [last[0] + 20, last[1]]]);
  };

  const removePoint = (index: number) => {
    if (points.length <= 2) return;
    onChange('points', points.filter((_, i) => i !== index));
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Line')}</div>
      <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        <label>{t('Line width:')} {props.lineWidth || 2}px</label>
        <input
          type="range"
          min={1}
          max={20}
          value={props.lineWidth || 2}
          onChange={(e) => onChange('lineWidth', parseInt(e.target.value) || 2)}
        />
      </div>
      <div className="property-row">
        <label>{t('Line color')}</label>
        <div className="color-input-wrapper">
          <input
            type="color"
            value={props.lineColor || '#333333'}
            onChange={(e) => onChange('lineColor', e.target.value)}
          />
          <input
            type="text"
            value={props.lineColor || '#333333'}
            onChange={(e) => onChange('lineColor', e.target.value)}
            className="color-text"
          />
        </div>
      </div>
      <CollapsibleSection title={t('Points ({0})', points.length)} defaultOpen>
        <div className="line-points-list">
          {points.map((pt, i) => (
            <div key={i} className="line-point-row">
              <span className="line-point-index">{i + 1}</span>
              <div className="line-point-fields">
                <label>X</label>
                <input
                  type="number"
                  value={pt[0]}
                  onChange={(e) => updatePoint(i, 0, parseInt(e.target.value) || 0)}
                  className="line-point-input"
                />
                <label>Y</label>
                <input
                  type="number"
                  value={pt[1]}
                  onChange={(e) => updatePoint(i, 1, parseInt(e.target.value) || 0)}
                  className="line-point-input"
                />
              </div>
              {points.length > 2 && (
                <button className="line-point-delete" onClick={() => removePoint(i)} title={t('Delete')}><Emoji c="✕" /></button>
              )}
            </div>
          ))}
          <button className="line-point-add" onClick={addPoint}>{t('+ Add point')}</button>
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default PropertyEditor;
