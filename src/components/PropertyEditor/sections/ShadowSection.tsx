import React from 'react';
import { t } from '../../../i18n';
import { isSectionVisible } from '../constants';
import type { PropertyCtx } from './types';
import { CollapsibleSection } from '../shared/CollapsibleSection';

export function ShadowSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, currentStyles, handleStyleChange } = ctx;
  return (
    <>
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
    </>
  );
}
