import React, { useState } from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';
import { CollapsibleSection } from '../shared/CollapsibleSection';

// Calendar editor component
export function CalendarEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const highlightedDates: string[] = props.highlightedDates || [];
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');

  const isValidDate = (str: string): boolean => {
    const match = str.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!match) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
  };

  const addDate = () => {
    const trimmed = dateInput.trim();
    if (!trimmed) return;
    if (!isValidDate(trimmed)) {
      setDateError(t('Invalid format, use YYYY-MM-DD'));
      return;
    }
    if (highlightedDates.includes(trimmed)) {
      setDateError(t('Date already exists'));
      return;
    }
    onChange('highlightedDates', [...highlightedDates, trimmed]);
    setDateInput('');
    setDateError('');
  };

  const removeDate = (date: string) => {
    onChange('highlightedDates', highlightedDates.filter(d => d !== date));
  };

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDate();
    }
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Calendar')}</div>
      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Year')}</label>
          <input
            type="number"
            value={props.year || new Date().getFullYear()}
            min={1970}
            max={2100}
            onChange={(e) => onChange('year', parseInt(e.target.value) || 2024)}
          />
        </div>
        <div className="property-field">
          <label>{t('Month')}</label>
          <input
            type="number"
            value={props.month || 1}
            min={1}
            max={12}
            onChange={(e) => onChange('month', Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
          />
        </div>
      </div>
      <div className="property-row">
        <label>{t('Show day names')}</label>
        <input
          type="checkbox"
          checked={props.showDayNames !== false}
          onChange={(e) => onChange('showDayNames', e.target.checked)}
        />
      </div>
      <div className="property-row">
        <label>{t('Today marker')}</label>
        <input
          type="checkbox"
          checked={props.showToday !== false}
          onChange={(e) => onChange('showToday', e.target.checked)}
        />
      </div>

      <CollapsibleSection title={t('Highlighted dates')} defaultOpen={highlightedDates.length > 0}>
        <div className="calendar-date-tags">
          {highlightedDates.map(date => (
            <span key={date} className="calendar-date-tag">
              {date}
              <button className="calendar-date-tag-remove" onClick={() => removeDate(date)}><Emoji c="✕" /></button>
            </span>
          ))}
        </div>
        <div className="calendar-date-input-row">
          <input
            type="text"
            value={dateInput}
            onChange={(e) => { setDateInput(e.target.value); setDateError(''); }}
            onKeyDown={handleDateKeyDown}
            placeholder="YYYY-MM-DD"
            className="calendar-date-input"
          />
          <button className="calendar-date-add-btn" onClick={addDate}>{t('Add')}</button>
        </div>
        {dateError && <span className="calendar-date-error">{dateError}</span>}
      </CollapsibleSection>

      <CollapsibleSection title={t('Date range')}>
        <div className="property-row">
          <label>{t('Range selection mode')}</label>
          <input
            type="checkbox"
            checked={props.dateRangeMode || false}
            onChange={(e) => onChange('dateRangeMode', e.target.checked)}
          />
        </div>
        {props.dateRangeMode && (
          <>
            <div className="property-row">
              <label>{t('Start date')}</label>
              <input
                type="date"
                value={props.rangeStart || ''}
                onChange={(e) => onChange('rangeStart', e.target.value)}
              />
            </div>
            <div className="property-row">
              <label>{t('End date')}</label>
              <input
                type="date"
                value={props.rangeEnd || ''}
                onChange={(e) => onChange('rangeEnd', e.target.value)}
              />
            </div>
          </>
        )}
      </CollapsibleSection>
    </div>
  );
}
