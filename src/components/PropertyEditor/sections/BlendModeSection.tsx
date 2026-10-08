import React from 'react';
import { t } from '../../../i18n';
import { isSectionVisible } from '../constants';
import type { PropertyCtx } from './types';
import type { StyleProps } from '../../../types';

export function BlendModeSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, currentStyles, handleStyleChange } = ctx;
  return (
    <>
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
    </>
  );
}
