import React from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';
import { CollapsibleSection } from '../shared/CollapsibleSection';

// Window editor component
export function WindowEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const headerButtons: Array<{ icon: string; id: string }> = props.headerButtons || [];

  const ICON_OPTIONS = ['✕', '☰', '⚙', '←', '→', '↑', '↓', '⟳', '⊕', '⊖'];

  const addHeaderButton = () => {
    const newBtn = { icon: '✕', id: `btn_${Date.now()}` };
    onChange('headerButtons', [...headerButtons, newBtn]);
  };

  const removeHeaderButton = (index: number) => {
    const newBtns = headerButtons.filter((_, i) => i !== index);
    onChange('headerButtons', newBtns);
  };

  const updateHeaderButton = (index: number, field: 'icon' | 'id', value: string) => {
    const newBtns = headerButtons.map((btn, i) =>
      i === index ? { ...btn, [field]: value } : btn
    );
    onChange('headerButtons', newBtns);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Window')}</div>
      <div className="property-row">
        <label>{t('Title')}</label>
        <input
          type="text"
          value={props.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div className="property-row">
        <label>{t('Title bar height')}</label>
        <input
          type="number"
          value={props.headerHeight ?? 40}
          min={20}
          max={80}
          onChange={(e) => onChange('headerHeight', parseInt(e.target.value) || 40)}
        />
      </div>
      <div className="property-row">
        <label>{t('Close button')}</label>
        <input
          type="checkbox"
          checked={props.showCloseBtn !== false}
          onChange={(e) => onChange('showCloseBtn', e.target.checked)}
        />
      </div>
      <CollapsibleSection title={t('Title bar buttons')}>
        <div className="win-btn-list">
          {headerButtons.map((btn, i) => (
            <div key={i} className="win-btn-item">
              <select
                value={btn.icon}
                onChange={(e) => updateHeaderButton(i, 'icon', e.target.value)}
                className="win-btn-icon-select"
              >
                {ICON_OPTIONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <input
                type="text"
                value={btn.id}
                onChange={(e) => updateHeaderButton(i, 'id', e.target.value)}
                placeholder={t('Button ID')}
                className="win-btn-id-input"
              />
              <button className="win-btn-delete" onClick={() => removeHeaderButton(i)} title={t('Delete')}><Emoji c="✕" /></button>
            </div>
          ))}
          <button className="win-btn-add" onClick={addHeaderButton}>{t('+ Add button')}</button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
