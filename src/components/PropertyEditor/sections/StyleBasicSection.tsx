import React from 'react';
import { t } from '../../../i18n';
import { isArcLike } from '../../../utils/arcStyle';
import { PART_LABELS, STYLE_STATES } from '../constants';
import { Link2, Unlock } from 'lucide-react';
import type { PropertyCtx } from './types';

export function StyleBasicSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, currentStyles, handleStyleChange, radiusLinked, setRadiusLinked, availableParts, activePart, setActivePart, activeState, setActiveStyleState, activeStyleState, hasStateOverride, handleClearStateOverride } = ctx;
  return (
    <>
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
    </>
  );
}
