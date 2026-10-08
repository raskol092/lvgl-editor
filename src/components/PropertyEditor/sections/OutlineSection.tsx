import React from 'react';
import { t } from '../../../i18n';
import { isSectionVisible } from '../constants';
import type { PropertyCtx } from './types';
import { CollapsibleSection } from '../shared/CollapsibleSection';

export function OutlineSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, currentStyles, handleStyleChange } = ctx;
  return (
    <>
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
    </>
  );
}
