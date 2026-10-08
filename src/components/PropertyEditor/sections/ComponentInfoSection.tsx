import React from 'react';
import ToolIcon from '../../icons/ToolIcon';
import { t } from '../../../i18n';
import type { PropertyCtx } from './types';

export function ComponentInfoSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, handlePropertyChange, definition } = ctx;
  return (
    <>
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
    </>
  );
}
