import React, { useCallback, useState, useMemo } from 'react';
import Emoji from '../icons/Emoji';
import ToolIcon from '../icons/ToolIcon';
import { t } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';
import { isArcLike } from '../../utils/arcStyle';
import { getComponentDefinition } from '../../utils/componentDefinitions';
import { PARTS_BY_TYPE } from '../../utils/styleKeys';
import BindingsEditor from './BindingsEditor';
import { ALIGN_OPTIONS, PART_LABELS, STYLE_STATES, isSectionVisible } from './constants';
import type { StyleState } from './constants';
import { Link2, Unlock } from 'lucide-react';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { renderFlagsSection } from './shared/FlagsSection';
import { FontSelector } from './shared/FontSelectors';
import { renderComponentProps } from './widgets/index';
import type { LvglComponent, StyleProps } from '../../types';
import './PropertyEditor.css';

const PropertyEditor: React.FC = () => {
  const { selection, getComponentById, updateComponent } = useEditorStore();
  const [activeState, setActiveStyleState] = useState<StyleState>('default');
  const [activePartRaw, setActivePart] = useState<string>('main');
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

  // part of the widget being styled (main or e.g. knob) and the key of the style in component.styles
  const availableParts = component ? (PARTS_BY_TYPE[component.type] || []) : [];
  const activePart = availableParts.includes(activePartRaw) ? activePartRaw : 'main';
  const activeStyleState: string = activePart === 'main' ? activeState : activeState === 'default' ? activePart : `${activePart}:${activeState}`;

  // Get the current style object for the active state
  const currentStyles: StyleProps = component
    ? (component.styles[activeStyleState] || (activePart === 'main' ? component.styles.default : {}))
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
      const baseStyles = component.styles[activeStyleState] || (activePart === 'main' ? { ...component.styles.default } : {});
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
      
      <div
        className="property-sections"
        onClick={(e) => {
          // click on a section title folds / unfolds the section
          const header = (e.target as HTMLElement).closest('.section-header');
          if (header && header.parentElement?.classList.contains('property-section')) {
            header.parentElement.classList.toggle('collapsed');
          }
        }}
      >
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

        {/* Position and size */}
        <div className="property-section">
          <div className="section-header">{t('Position and size')}</div>
          <div className="geometry-grid">
            <div className="geometry-field">
              <label>X</label>
              <input
                type="number"
                value={component.x}
                onChange={(e) => handlePropertyChange('x', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="geometry-field">
              <label>Y</label>
              <input
                type="number"
                value={component.y}
                onChange={(e) => handlePropertyChange('y', parseInt(e.target.value) || 0)}
              />
            </div>
            {(['width', 'height'] as const).map((dim) => {
              const modeKey = dim === 'width' ? 'widthMode' : 'heightMode';
              const mode = component[modeKey] || 'px';
              const min = mode === 'percent' ? 1 : 10;
              const max = mode === 'percent' ? 100 : Infinity;
              return (
                <div className="geometry-field" key={dim}>
                  <label>{dim === 'width' ? t('Width') : t('Height')}</label>
                  <div className="geometry-size">
                    {mode === 'content' ? (
                      <div className="geometry-auto">{t('Fit content')}</div>
                    ) : (
                      <input
                        type="number"
                        value={component[dim]}
                        min={min}
                        max={max === Infinity ? undefined : max}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || min;
                          handlePropertyChange(dim, Math.min(max, Math.max(min, v)));
                        }}
                      />
                    )}
                    <select
                      value={mode}
                      title={t('Size unit')}
                      onChange={(e) => handlePropertyChange(modeKey, e.target.value)}
                    >
                      <option value="px">px</option>
                      <option value="percent">%</option>
                      <option value="content">auto</option>
                    </select>
                  </div>
                </div>
              );
            })}
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
          <div className="section-header">{t('Flags')}</div>
          {renderFlagsSection(component, handlePropertyChange)}
        </div>

        {/* Styles */}
        <div className="property-section">
          <div className="section-header">{t('Style')}</div>
          
          {/* Part of the widget (knob, indicator, ...) */}
          {availableParts.length > 0 && (
            <div className="style-state-switcher">
              {['main', ...availableParts].map((part) => (
                <button
                  key={part}
                  className={`style-state-btn ${activePart === part ? 'active' : ''}`}
                  onClick={() => setActivePart(part)}
                >
                  {part === 'main' ? t('Main') : PART_LABELS[part] || part}
                </button>
              ))}
            </div>
          )}
          {/* Style state switcher */}
          <div className="style-state-switcher">
            {STYLE_STATES.map(({ key, label }) => {
              const k = activePart === 'main' ? key : key === 'default' ? activePart : `${activePart}:${key}`;
              return (
                <button
                  key={key}
                  className={`style-state-btn ${activeState === key ? 'active' : ''} ${(key !== 'default' || activePart !== 'main') && component.styles[k] ? 'has-override' : ''}`}
                  onClick={() => setActiveStyleState(key)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          
          {activeStyleState !== 'default' && (
            <div className="style-state-info">
              {hasStateOverride ? (
                <button className="clear-override-btn" onClick={handleClearStateOverride}>
                  {t('Clear')}{activePart === 'main' ? '' : `${PART_LABELS[activePart] || activePart} / `}{STYLE_STATES.find(s => s.key === activeState)?.label}{t('State styles')}
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
          
          {!isArcLike(component.type) && (
            <>
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
            </>
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

          {/* Advanced */}
          <CollapsibleSection title={t('Advanced')} defaultOpen={false}>
            {([
              ['minWidth', 'Min width'], ['maxWidth', 'Max width'], ['minHeight', 'Min height'], ['maxHeight', 'Max height'],
              ['marginTop', 'Margin top'], ['marginBottom', 'Margin bottom'], ['marginLeft', 'Margin left'], ['marginRight', 'Margin right'],
              ['padRow', 'Row gap'], ['padColumn', 'Column gap'],
              ['translateX', 'Translate X'], ['translateY', 'Translate Y'], ['skewX', 'Skew X'], ['skewY', 'Skew Y'],
              ['textOutlineWidth', 'Text outline width'],
              ['transformWidth', 'Grow width by'], ['transformHeight', 'Grow height by'], ['bgMainStop', 'Gradient start (0-255)'], ['blurRadius', 'Blur radius'],
            ] as Array<[string, string]>).map(([k, label]) => (
              <div className="property-row" key={k}>
                <label>{t(label)}</label>
                <input
                  type="number"
                  value={(currentStyles as Record<string, number | undefined>)[k] ?? 0}
                  onChange={(e) => handleStyleChange(k as never, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
            <div className="property-row">
              <label>{t('Text outline color')}</label>
              <input type="color" value={currentStyles.textOutlineColor || '#000000'} onChange={(e) => handleStyleChange('textOutlineColor' as never, e.target.value)} />
            </div>
            {([['bgOpa', 'Background opacity'], ['borderOpa', 'Border opacity'], ['outlineOpa', 'Outline opacity'], ['textOpa', 'Text opacity']] as Array<[string, string]>).map(([k, label]) => (
              <div className="property-row" key={k}>
                <label>{t(label)}</label>
                <input
                  type="range" min={0} max={255} step={1}
                  value={(currentStyles as Record<string, number | undefined>)[k] ?? 255}
                  onChange={(e) => handleStyleChange(k as never, parseInt(e.target.value))}
                />
                <span className="range-value">{(currentStyles as Record<string, number | undefined>)[k] ?? 255}</span>
              </div>
            ))}
            <div className="property-row">
              <label>{t('Border above content')}</label>
              <input type="checkbox" checked={currentStyles.borderPost === true} onChange={(e) => handleStyleChange('borderPost' as never, e.target.checked as never)} />
            </div>
            <div className="property-row">
              <label>{t('Clip corner')}</label>
              <input type="checkbox" checked={currentStyles.clipCorner === true} onChange={(e) => handleStyleChange('clipCorner' as never, e.target.checked as never)} />
            </div>
          </CollapsibleSection>

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
        <BindingsEditor component={component} onChange={(bindings) => handlePropertyChange('bindings', bindings)} />

        {/* Flex/Grid child properties */}
        {parentLayout === 'flex' && (
          <div className="property-section">
            <div className="section-header">{t('Flex item')}</div>
            <div className="property-row">
              <label>{t('Flex grow')}</label>
              <input
                type="number"
                value={component.props.flexGrow ?? 0}
                min={0}
                max={10}
                onChange={(e) => handlePropsChange('flexGrow', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>{t('Flex shrink')}</label>
              <input
                type="number"
                value={component.props.flexShrink ?? 1}
                min={0}
                max={10}
                onChange={(e) => handlePropsChange('flexShrink', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-row">
              <label>{t('Align self')}</label>
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

export default PropertyEditor;
