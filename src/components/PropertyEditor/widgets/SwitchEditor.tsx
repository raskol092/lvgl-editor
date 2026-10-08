import React from 'react';
import { t } from '../../../i18n';
import { ToggleSwitch } from '../shared/ToggleSwitch';
import type { WidgetEditorProps } from './types';

export function SwitchEditor({ component, onChange }: WidgetEditorProps): React.ReactNode {
  const { props } = component;
      return (
        <div className="property-section">
          <div className="section-header">{t('Switch')}</div>
          <div className="property-row">
            <label>{t('On')}</label>
            <ToggleSwitch
              checked={props.checked || false}
              onChange={(checked) => onChange('checked', checked)}
            />
          </div>
        </div>
      );

}
