import React from 'react';
import { t } from '../../../i18n';
import { isSectionVisible } from '../constants';
import type { PropertyCtx } from './types';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { FontSelector } from '../shared/FontSelectors';
import type { StyleProps } from '../../../types';

export function TextFontSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, currentStyles, handleStyleChange } = ctx;
  return (
    <>
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
    </>
  );
}
