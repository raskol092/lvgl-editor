import React, { useState } from 'react';
import { t } from '../../../i18n';
import { CollapsibleSection } from '../shared/CollapsibleSection';

// Table editor component
export function TableEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const rows: number = props.rows ?? 3;
  const cols: number = props.cols ?? 3;
  const cellData: string[][] = props.cellData || Array.from({ length: rows }, () => Array(cols).fill(''));
  const cellAligns: string[][] = props.cellAligns || Array.from({ length: rows }, () => Array(cols).fill('left'));
  const columnWidths: number[] = props.columnWidths || Array(cols).fill(60);
  const headerRow: boolean = props.headerRow ?? true;

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  // Ensure arrays match current rows/cols dimensions
  const ensureSize = (data: string[][], r: number, c: number, fill: string): string[][] => {
    const result: string[][] = [];
    for (let i = 0; i < r; i++) {
      const row: string[] = [];
      for (let j = 0; j < c; j++) {
        row.push(data[i]?.[j] ?? fill);
      }
      result.push(row);
    }
    return result;
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    const newData = cellData.map(row => [...row]);
    if (!newData[r]) newData[r] = Array(cols).fill('');
    newData[r][c] = value;
    onChange('cellData', newData);
  };

  const handleCellAlignChange = (align: string) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    const newAligns = cellAligns.map(row => [...row]);
    if (!newAligns[r]) newAligns[r] = Array(cols).fill('left');
    newAligns[r][c] = align;
    onChange('cellAligns', newAligns);
  };

  const handleColWidthChange = (c: number, value: number) => {
    const newWidths = [...columnWidths];
    newWidths[c] = Math.max(20, value);
    onChange('columnWidths', newWidths);
  };

  const handleRowsChange = (newRows: number) => {
    if (newRows < 1) return;
    const newData = ensureSize(cellData, newRows, cols, '');
    const newAligns = ensureSize(cellAligns, newRows, cols, 'left');
    onChange('rows', newRows);
    onChange('cellData', newData);
    onChange('cellAligns', newAligns);
  };

  const handleColsChange = (newCols: number) => {
    if (newCols < 1) return;
    const newData = ensureSize(cellData, rows, newCols, '');
    const newAligns = ensureSize(cellAligns, rows, newCols, 'left');
    const newWidths: number[] = [];
    for (let j = 0; j < newCols; j++) {
      newWidths.push(columnWidths[j] ?? 60);
    }
    onChange('cols', newCols);
    onChange('cellData', newData);
    onChange('cellAligns', newAligns);
    onChange('columnWidths', newWidths);
  };

  const addRow = () => handleRowsChange(rows + 1);
  const addCol = () => handleColsChange(cols + 1);
  const deleteRow = () => { if (rows > 1) handleRowsChange(rows - 1); };
  const deleteCol = () => { if (cols > 1) handleColsChange(cols - 1); };

  return (
    <div className="property-section">
      <div className="section-header">{t('Table')}</div>
      <div className="property-row">
        <label>{t('Header row')}</label>
        <input
          type="checkbox"
          checked={headerRow}
          onChange={(e) => onChange('headerRow', e.target.checked)}
        />
      </div>
      <div className="table-editor-actions">
        <button onClick={addRow} title={t('Add row')}>{t('+ Row')}</button>
        <button onClick={addCol} title={t('Add column')}>{t('+ Column')}</button>
        <button onClick={deleteRow} title={t('Delete last row')} disabled={rows <= 1}>{t('- Row')}</button>
        <button onClick={deleteCol} title={t('Delete last column')} disabled={cols <= 1}>{t('- Column')}</button>
      </div>
      {selectedCell && (
        <div className="table-cell-align-bar">
          <span className="table-cell-align-label">{t('Cell align:')}</span>
          {(['left', 'center', 'right'] as const).map(a => (
            <button
              key={a}
              className={`table-align-btn ${cellAligns[selectedCell[0]]?.[selectedCell[1]] === a ? 'active' : ''}`}
              onClick={() => handleCellAlignChange(a)}
              title={a === 'left' ? t('Align left') : a === 'center' ? t('Center') : t('Align right')}
            >
              {a === 'left' ? '⫷' : a === 'center' ? '⫿' : '⫸'}
            </button>
          ))}
        </div>
      )}
      <div className="table-editor-wrapper">
        <table className="table-editor-table">
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} className={r === 0 && headerRow ? 'table-header-row' : ''}>
                {Array.from({ length: cols }, (_, c) => (
                  <td
                    key={c}
                    className={`table-editor-cell ${selectedCell?.[0] === r && selectedCell?.[1] === c ? 'selected' : ''}`}
                    style={{ textAlign: (cellAligns[r]?.[c] || 'left') as React.CSSProperties['textAlign'] }}
                    onClick={() => setSelectedCell([r, c])}
                  >
                    <input
                      type="text"
                      className="table-cell-input"
                      value={cellData[r]?.[c] ?? ''}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      onFocus={() => setSelectedCell([r, c])}
                      style={{ textAlign: (cellAligns[r]?.[c] || 'left') as React.CSSProperties['textAlign'] }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CollapsibleSection title={t('Column width settings')}>
        {Array.from({ length: cols }, (_, c) => (
          <div key={c} className="property-row">
            <label>{t('Column')} {c + 1}</label>
            <input
              type="number"
              value={columnWidths[c] ?? 60}
              min={20}
              onChange={(e) => handleColWidthChange(c, parseInt(e.target.value) || 60)}
            />
          </div>
        ))}
      </CollapsibleSection>
    </div>
  );
}
