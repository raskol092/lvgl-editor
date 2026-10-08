import React from 'react';
import { t } from '../../../i18n';
import type { WidgetEditorProps } from './types';

export function LedEditor({ component, onChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('LED')}</div>
          <div className="property-row">
            <label>{t('Color')}</label>
            <div className="color-input-wrapper">
              <input type="color" value={props.color || '#2196F3'} onChange={(e) => onChange('color', e.target.value)} />
              <input type="text" value={props.color || ''} placeholder={t('Theme')} onChange={(e) => onChange('color', e.target.value)} className="color-text" />
            </div>
          </div>
          <div className="property-row">
            <label>{t('On')}</label>
            <input type="checkbox" checked={props.checked !== false} onChange={(e) => onChange('checked', e.target.checked)} />
          </div>
          <div className="property-row">
            <label>{t('Brightness')}</label>
            <div className="range-with-value">
              <input type="range" min={0} max={255} value={props.brightness ?? 255} onChange={(e) => onChange('brightness', parseInt(e.target.value) || 0)} />
              <input type="number" className="range-number-input" min={0} max={255} value={props.brightness ?? 255} onChange={(e) => onChange('brightness', Math.max(0, Math.min(255, parseInt(e.target.value) || 0)))} />
            </div>
          </div>
        </div>
      );

}
