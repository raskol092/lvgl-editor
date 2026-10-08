import React from 'react';
import { t } from '../../../i18n';

// TileView grid editor component
export function TileGridEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const rows: number = props.rows || 2;
  const cols: number = props.cols || 2;
  const currentRow: number = props.currentRow || 0;
  const currentCol: number = props.currentCol || 0;
  const tileChildMap: Record<string, string[]> = props.tileChildMap || {};

  const selectTile = (r: number, c: number) => {
    onChange('currentRow', r);
    onChange('currentCol', c);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Tile view')}</div>
      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Rows')}</label>
          <input
            type="number"
            value={rows}
            min={1}
            max={10}
            onChange={(e) => onChange('rows', Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
        <div className="property-field">
          <label>{t('Columns')}</label>
          <input
            type="number"
            value={cols}
            min={1}
            max={10}
            onChange={(e) => onChange('cols', Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="tile-grid-visual">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="tile-grid-row">
            {Array.from({ length: cols }, (_, c) => {
              const key = `${r}-${c}`;
              const childCount = (tileChildMap[key] || []).length;
              const isActive = r === currentRow && c === currentCol;
              return (
                <div
                  key={c}
                  className={`tile-grid-cell ${isActive ? 'active' : ''}`}
                  onClick={() => selectTile(r, c)}
                  title={t('Tile [{0}, {1}] - {2} components', r, c, childCount)}
                >
                  <span className="tile-grid-cell-label">{childCount}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="property-row two-col">
        <div className="property-field">
          <label>{t('Current row')}</label>
          <input
            type="number"
            value={currentRow}
            min={0}
            max={rows - 1}
            onChange={(e) => onChange('currentRow', Math.min(rows - 1, Math.max(0, parseInt(e.target.value) || 0)))}
          />
        </div>
        <div className="property-field">
          <label>{t('Current column')}</label>
          <input
            type="number"
            value={currentCol}
            min={0}
            max={cols - 1}
            onChange={(e) => onChange('currentCol', Math.min(cols - 1, Math.max(0, parseInt(e.target.value) || 0)))}
          />
        </div>
      </div>
      <div className="tile-grid-hint">{t('Dropped components are assigned to the selected tile automatically')}</div>
    </div>
  );
}
