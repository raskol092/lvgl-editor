import React from 'react';
import { t } from '../../../i18n';
import { getArcStyle } from '../../../utils/arcStyle';
import type { WidgetEditorProps } from './types';

export function ArcEditor({ component, onChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
  const arcStyle = getArcStyle(component);
      return (
        <div className="property-section">
          <div className="section-header">{t('Arc')}</div>
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
          <div className="property-row">
            <label>{t('Show knob')}</label>
            <input type="checkbox" checked={props.hideKnob !== true} onChange={(e) => onChange('hideKnob', !e.target.checked)} />
          </div>
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Start angle:')} {props.startAngle || 135}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={props.startAngle || 135}
              onChange={(e) => onChange('startAngle', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('End angle:')} {props.endAngle || 45}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={props.endAngle || 45}
              onChange={(e) => onChange('endAngle', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Min')}</label>
              <input
                type="number"
                value={props.min || 0}
                onChange={(e) => onChange('min', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>{t('Max')}</label>
              <input
                type="number"
                value={props.max || 100}
                onChange={(e) => onChange('max', parseInt(e.target.value) || 100)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Current value')}</label>
            <div className="range-with-value">
              <input
                type="range"
                min={props.min || 0}
                max={props.max || 100}
                value={props.value || 0}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                className="range-number-input"
                value={props.value || 0}
                min={props.min || 0}
                max={props.max || 100}
                onChange={(e) => onChange('value', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="property-row">
            <label>{t('Mode')}</label>
            <select
              value={props.mode || 'normal'}
              onChange={(e) => onChange('mode', e.target.value)}
            >
              <option value="normal">{t('Normal mode')}</option>
              <option value="symmetrical">{t('Symmetrical')}</option>
              <option value="reverse">{t('Reverse')}</option>
            </select>
          </div>
        </div>
      );

}
