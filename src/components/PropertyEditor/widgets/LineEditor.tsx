import React from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';
import { CollapsibleSection } from '../shared/CollapsibleSection';

// Line editor with points list
export function LineEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const points: number[][] = props.points || [[0, 0], [100, 0]];

  const updatePoint = (index: number, axis: 0 | 1, value: number) => {
    const newPoints = points.map((p, i) =>
      i === index ? (axis === 0 ? [value, p[1]] : [p[0], value]) : [...p]
    );
    onChange('points', newPoints);
  };

  const addPoint = () => {
    const last = points[points.length - 1] || [0, 0];
    onChange('points', [...points, [last[0] + 20, last[1]]]);
  };

  const removePoint = (index: number) => {
    if (points.length <= 2) return;
    onChange('points', points.filter((_, i) => i !== index));
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Line')}</div>
      <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        <label>{t('Line width:')} {props.lineWidth || 2}px</label>
        <input
          type="range"
          min={1}
          max={20}
          value={props.lineWidth || 2}
          onChange={(e) => onChange('lineWidth', parseInt(e.target.value) || 2)}
        />
      </div>
      <div className="property-row">
        <label>{t('Line color')}</label>
        <div className="color-input-wrapper">
          <input
            type="color"
            value={props.lineColor || '#333333'}
            onChange={(e) => onChange('lineColor', e.target.value)}
          />
          <input
            type="text"
            value={props.lineColor || '#333333'}
            onChange={(e) => onChange('lineColor', e.target.value)}
            className="color-text"
          />
        </div>
      </div>
      <CollapsibleSection title={t('Points ({0})', points.length)} defaultOpen>
        <div className="line-points-list">
          {points.map((pt, i) => (
            <div key={i} className="line-point-row">
              <span className="line-point-index">{i + 1}</span>
              <div className="line-point-fields">
                <label>X</label>
                <input
                  type="number"
                  value={pt[0]}
                  onChange={(e) => updatePoint(i, 0, parseInt(e.target.value) || 0)}
                  className="line-point-input"
                />
                <label>Y</label>
                <input
                  type="number"
                  value={pt[1]}
                  onChange={(e) => updatePoint(i, 1, parseInt(e.target.value) || 0)}
                  className="line-point-input"
                />
              </div>
              {points.length > 2 && (
                <button className="line-point-delete" onClick={() => removePoint(i)} title={t('Delete')}><Emoji c="✕" /></button>
              )}
            </div>
          ))}
          <button className="line-point-add" onClick={addPoint}>{t('+ Add point')}</button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
