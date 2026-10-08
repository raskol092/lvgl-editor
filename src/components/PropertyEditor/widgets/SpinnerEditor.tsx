import React from 'react';
import { t } from '../../../i18n';
import { getArcStyle } from '../../../utils/arcStyle';
import type { WidgetEditorProps } from './types';

export function SpinnerEditor({ component, onChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
  const arcStyle = getArcStyle(component);
      return (
        <div className="property-section">
          <div className="section-header">{t('Spinner')}</div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Arc width')}</label>
              <input
                type="number"
                min={1}
                max={200}
                value={arcStyle.width}
                onChange={(e) => onChange('arcWidth', Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Arc color')}</label>
            <div className="color-input-wrapper">
              <input type="color" value={arcStyle.color} onChange={(e) => onChange('arcColor', e.target.value)} />
              <input type="text" value={arcStyle.color} onChange={(e) => onChange('arcColor', e.target.value)} className="color-text" />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Track color')}</label>
            <div className="color-input-wrapper">
              <input type="color" value={arcStyle.track} onChange={(e) => onChange('arcTrackColor', e.target.value)} />
              <input type="text" value={arcStyle.track} onChange={(e) => onChange('arcTrackColor', e.target.value)} className="color-text" />
            </div>
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Spin speed:')} {props.speed || 1000}ms</label>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={props.speed || 1000}
              onChange={(e) => onChange('speed', parseInt(e.target.value) || 1000)}
            />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Arc length:')} {props.arcLength || 60}°</label>
            <input
              type="range"
              min={10}
              max={360}
              value={props.arcLength || 60}
              onChange={(e) => onChange('arcLength', parseInt(e.target.value) || 60)}
            />
          </div>
        </div>
      );

}
