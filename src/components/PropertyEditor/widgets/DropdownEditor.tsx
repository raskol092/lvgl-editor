import React from 'react';
import { t } from '../../../i18n';
import { ComponentFontSelector } from '../shared/FontSelectors';
import { DropdownOptionsEditor } from './DropdownOptionsEditor';
import type { WidgetEditorProps } from './types';

export function DropdownEditor({ component, onChange, onBatchChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('Dropdown')}</div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <label>{t('Options')}</label>
            <DropdownOptionsEditor
              options={props.options || ['Option 1', 'Option 2', 'Option 3']}
              onChange={(newOptions) => onChange('options', newOptions)}
            />
          </div>
          <div className="property-row">
            <label>{t('Default selected')}</label>
            <select
              value={props.selected || 0}
              onChange={(e) => onChange('selected', parseInt(e.target.value) || 0)}
            >
              {(props.options || ['Option 1', 'Option 2', 'Option 3']).map((opt: string, i: number) => (
                <option key={i} value={i}>{i}: {opt}</option>
              ))}
            </select>
          </div>
          <ComponentFontSelector
            fontResource={props.fontResource}
            fontSize={props.fontSize}
            onChange={onChange}
            onBatchChange={onBatchChange}
          />
          <div className="property-row">
            <label>{t('Open direction')}</label>
            <select
              value={props.direction || 'down'}
              onChange={(e) => onChange('direction', e.target.value)}
            >
              <option value="down">{t('Down')}</option>
              <option value="up">{t('Up')}</option>
            </select>
          </div>
        </div>
      );

}
