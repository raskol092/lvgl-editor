import React from 'react';
import { t } from '../../../i18n';
import type { PropertyCtx } from './types';

export function FlexItemSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, handlePropsChange, parentLayout } = ctx;
  return (
    <>
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
    </>
  );
}
