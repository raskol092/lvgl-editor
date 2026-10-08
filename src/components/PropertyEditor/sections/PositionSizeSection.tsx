import React from 'react';
import { t } from '../../../i18n';
import type { PropertyCtx } from './types';

export function PositionSizeSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, handlePropertyChange } = ctx;
  return (
    <>
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
    </>
  );
}
