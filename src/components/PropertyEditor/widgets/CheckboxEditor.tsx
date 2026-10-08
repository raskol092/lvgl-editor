import React from 'react';
import { t } from '../../../i18n';
import { ComponentFontSelector } from '../shared/FontSelectors';
import type { WidgetEditorProps } from './types';

export function CheckboxEditor({ component, onChange, onBatchChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('Checkbox')}</div>
          <div className="property-row">
            <label>{t('Text')}</label>
            <input
              type="text"
              value={props.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
            />
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Checked')}</label>
            <input
              type="checkbox"
              checked={props.checked || false}
              onChange={(e) => onChange('checked', e.target.checked)}
            />
          </div>
        </div>
      );

}
