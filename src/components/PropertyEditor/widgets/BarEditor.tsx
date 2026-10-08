import React from 'react';
import { t } from '../../../i18n';
import type { WidgetEditorProps } from './types';

export function BarEditor({ component, onChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('Progress bar')}</div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Min')}</label>
              <input
                type="number"
                value={props.min ?? 0}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value) || 0;
                  onChange('min', newMin);
                  const curVal = props.value ?? 50;
                  const curMax = props.max ?? 100;
                  if (curVal < newMin) onChange('value', newMin);
                  if (curMax < newMin) onChange('max', newMin);
                }}
              />
            </div>
            <div className="property-field">
              <label>{t('Max')}</label>
              <input
                type="number"
                value={props.max ?? 100}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value) || 100;
                  onChange('max', newMax);
                  const curVal = props.value ?? 50;
                  const curMin = props.min ?? 0;
                  if (curVal > newMax) onChange('value', newMax);
                  if (curMin > newMax) onChange('min', newMax);
                }}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Current value')}</label>
            <div className="range-with-value">
              <input
                type="range"
                min={props.min ?? 0}
                max={props.max ?? 100}
                value={props.value ?? 50}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                className="range-number-input"
                value={props.value ?? 50}
                min={props.min ?? 0}
                max={props.max ?? 100}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Indicator color')}</label>
            <div className="color-input-wrapper">
              <input type="color" value={props.indicatorColor || '#2196F3'} onChange={(e) => onChange('indicatorColor', e.target.value)} />
              <input type="text" value={props.indicatorColor || ''} placeholder={t('Theme')} onChange={(e) => onChange('indicatorColor', e.target.value)} className="color-text" />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Direction')}</label>
            <select
              value={props.orientation || 'horizontal'}
              onChange={(e) => onChange('orientation', e.target.value)}
            >
              <option value="horizontal">{t('Horizontal')}</option>
              <option value="vertical">{t('Vertical')}</option>
            </select>
          </div>
        </div>
      );

}
