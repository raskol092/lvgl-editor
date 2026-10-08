import React from 'react';
import { t } from '../../../i18n';
import type { PropertyCtx } from './types';

export function GridItemSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, handlePropsChange, parentLayout } = ctx;
  return (
    <>
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
    </>
  );
}
