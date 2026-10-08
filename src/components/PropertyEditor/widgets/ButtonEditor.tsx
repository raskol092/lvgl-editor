import React from 'react';
import { t } from '../../../i18n';
import { ComponentFontSelector } from '../shared/FontSelectors';
import { ContainerLayoutEditor } from './ContainerLayoutEditor';
import type { WidgetEditorProps } from './types';

export function ButtonEditor({ component, onChange, onBatchChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <>
          <div className="property-section">
            <div className="section-header">{t('Button')}</div>
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
                value={props.textAlign || 'center'}
                onChange={(e) => onChange('textAlign', e.target.value)}
              >
                <option value="left">{t('Align left')}</option>
                <option value="center">{t('Center')}</option>
                <option value="right">{t('Align right')}</option>
              </select>
            </div>
          </div>
          <ContainerLayoutEditor props={props} onChange={onChange} />
        </>
      );

}
