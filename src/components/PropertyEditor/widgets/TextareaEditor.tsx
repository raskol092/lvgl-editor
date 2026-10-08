import React from 'react';
import { t } from '../../../i18n';
import { ComponentFontSelector } from '../shared/FontSelectors';
import type { WidgetEditorProps } from './types';

export function TextareaEditor({ component, onChange, onBatchChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('Textarea')}</div>
          <div className="property-row">
            <label>{t('Content')}</label>
            <textarea
              value={props.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
          <div className="property-row">
            <label>{t('Placeholder')}</label>
            <input
              type="text"
              value={props.placeholder || ''}
              onChange={(e) => onChange('placeholder', e.target.value)}
            />
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Max length')}</label>
            <input
              type="number"
              value={props.maxLength || 0}
              min={0}
              onChange={(e) => onChange('maxLength', parseInt(e.target.value) || 0)}
              style={{ flex: 1 }}
            />
            {(props.maxLength || 0) === 0 && <span style={{ fontSize: 11, color: '#999', marginLeft: 6, whiteSpace: 'nowrap' }}>{t('(unlimited)')}</span>}
          </div>
          <div className="property-row">
            <label>{t('Password mode')}</label>
            <input
              type="checkbox"
              checked={props.password || false}
              onChange={(e) => onChange('password', e.target.checked)}
            />
          </div>
          <div className="property-row">
            <label>{t('One-line mode')}</label>
            <input
              type="checkbox"
              checked={props.oneLine || false}
              onChange={(e) => onChange('oneLine', e.target.checked)}
            />
          </div>
        </div>
      );

}
