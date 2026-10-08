import React from 'react';
import { t } from '../../../i18n';
import { ComponentFontSelector } from '../shared/FontSelectors';
import type { WidgetEditorProps } from './types';

export function LabelEditor({ component, onChange, onBatchChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('Label')}</div>
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
            <label>{t('Text align')}</label>
            <select
              value={props.textAlign || 'left'}
              onChange={(e) => onChange('textAlign', e.target.value)}
            >
              <option value="left">{t('Align left')}</option>
              <option value="center">{t('Center')}</option>
              <option value="right">{t('Align right')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Long text mode')}</label>
            <select
              value={props.longMode || 'wrap'}
              onChange={(e) => onChange('longMode', e.target.value)}
            >
              <option value="wrap">{t('Wrap')}</option>
              <option value="scroll">{t('Scroll')}</option>
              <option value="dot">{t('Ellipsis')}</option>
              <option value="clip">{t('Clip')}</option>
            </select>
          </div>
        </div>
      );

}
