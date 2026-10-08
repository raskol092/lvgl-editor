import React, { useState } from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';

// Chart series editor component
export function ChartSeriesEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  // Backward compat: migrate old data field to series
  const series: Array<{ name: string; data: number[]; color: string; lineWidth?: number; pointSize?: number }> =
    props.series || (props.data ? [{ name: t('Series') + ' 1', data: props.data, color: props.lineColor || '#2196F3', lineWidth: 2, pointSize: 4 }] : [{ name: t('Series') + ' 1', data: [10, 20, 30, 25, 40], color: '#2196F3', lineWidth: 2, pointSize: 4 }]);

  const [expandedSeries, setExpandedSeries] = useState<number | null>(0);

  const updateSeries = (index: number, field: string, value: unknown) => {
    const newSeries = series.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange('series', newSeries);
  };

  const addSeries = () => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
    const color = colors[series.length % colors.length];
    onChange('series', [...series, { name: `${t('Series')} ${series.length + 1}`, data: [0, 0, 0], color, lineWidth: 2, pointSize: 4 }]);
    setExpandedSeries(series.length);
  };

  const removeSeries = (index: number) => {
    if (series.length <= 1) return;
    const newSeries = series.filter((_, i) => i !== index);
    onChange('series', newSeries);
    if (expandedSeries === index) setExpandedSeries(null);
    else if (expandedSeries !== null && expandedSeries > index) setExpandedSeries(expandedSeries - 1);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Chart')}</div>
      <div className="property-row">
        <label>{t('Type')}</label>
        <select
          value={props.type || 'line'}
          onChange={(e) => onChange('type', e.target.value)}
        >
          <option value="line">{t('Line chart')}</option>
          <option value="bar">{t('Bar chart')}</option>
          <option value="scatter">{t('Scatter chart')}</option>
          <option value="curve">{t('Curve chart')}</option>
          <option value="stacked">{t('Stacked bar chart')}</option>
        </select>
      </div>

      <div className="chart-series-list">
        <div className="chart-series-header">
          <span>{t('Data series (')}{series.length})</span>
          <button className="chart-series-add-btn" onClick={addSeries}>{t('+ Add')}</button>
        </div>
        {series.map((s, i) => (
          <div key={i} className="chart-series-item">
            <div
              className={`chart-series-row ${expandedSeries === i ? 'expanded' : ''}`}
              onClick={() => setExpandedSeries(expandedSeries === i ? null : i)}
            >
              <span className="chart-series-color-dot" style={{ backgroundColor: s.color }} />
              <span className="chart-series-name">{s.name}</span>
              <span className="chart-series-count">{s.data.length}{t('points')}</span>
              {series.length > 1 && (
                <button
                  className="chart-series-delete"
                  onClick={(e) => { e.stopPropagation(); removeSeries(i); }}
                  title={t('Delete series')}
                ><Emoji c="✕" /></button>
              )}
            </div>
            {expandedSeries === i && (
              <div className="chart-series-detail">
                <div className="property-row">
                  <label>{t('Name')}</label>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSeries(i, 'name', e.target.value)}
                  />
                </div>
                <div className="property-row">
                  <label>{t('Color')}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) => updateSeries(i, 'color', e.target.value)}
                    />
                    <input
                      type="text"
                      value={s.color}
                      onChange={(e) => updateSeries(i, 'color', e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
                <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <label>{t('Data points')}</label>
                  <input
                    type="text"
                    value={s.data.join(', ')}
                    onChange={(e) => updateSeries(i, 'data', e.target.value.split(',').map((v: string) => parseInt(v.trim()) || 0))}
                    placeholder="10, 20, 30, 40"
                  />
                </div>
                <div className="property-row two-col">
                  <div className="property-field">
                    <label>{t('Line width')}</label>
                    <input
                      type="number"
                      value={s.lineWidth ?? 2}
                      min={1}
                      max={10}
                      onChange={(e) => updateSeries(i, 'lineWidth', parseInt(e.target.value) || 2)}
                    />
                  </div>
                  <div className="property-field">
                    <label>{t('Point size')}</label>
                    <input
                      type="number"
                      value={s.pointSize ?? 4}
                      min={0}
                      max={20}
                      onChange={(e) => updateSeries(i, 'pointSize', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Y axis min')}</label>
          <input
            type="number"
            value={props.yAxisMin ?? 0}
            onChange={(e) => onChange('yAxisMin', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="property-field">
          <label>{t('Y axis max')}</label>
          <input
            type="number"
            value={props.yAxisMax ?? 100}
            onChange={(e) => onChange('yAxisMax', parseInt(e.target.value) || 100)}
          />
        </div>
      </div>
      <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        <label>{t('X axis labels')}</label>
        <input
          type="text"
          value={(props.xLabels || []).join(', ')}
          onChange={(e) => onChange('xLabels', e.target.value.split(',').map((v: string) => v.trim()).filter(Boolean))}
          placeholder={t('Label 1, Label 2, ...')}
        />
      </div>
      <div className="property-row">
        <label>{t('Show legend')}</label>
        <input
          type="checkbox"
          checked={props.showLegend || false}
          onChange={(e) => onChange('showLegend', e.target.checked)}
        />
      </div>
      <div className="property-row">
        <label>{t('Show grid')}</label>
        <input
          type="checkbox"
          checked={props.showGrid !== false}
          onChange={(e) => onChange('showGrid', e.target.checked)}
        />
      </div>
    </div>
  );
}
