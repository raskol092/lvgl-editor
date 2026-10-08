import React from 'react';
import type { RenderCtx } from '../types';

export function renderTable(ctx: RenderCtx): React.ReactNode {
  const { component, props, defaultStyle, th, defaultFontSize } = ctx;
        // lv_table: rows separated by horizontal lines, columns have their own widths, a scrollbar when it overflows
        const rows = Number(props.rows || 3);
        const cols = Number(props.cols || 3);
        const widths: number[] = Array.from({ length: cols }, (_, c) => Number(props.columnWidths?.[c]) || 60);
        const fs = Number(props.fontSize) || defaultFontSize;
        const rowH = Math.round(fs + 42);
        const overflowY = rows * rowH > component.height;
        return (
          <div className="lvgl-table" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            color: th.text,
            fontSize: fs,
            borderRadius: defaultStyle.borderRadius || 0,
          }}>
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} style={{ display: 'flex', height: rowH, boxSizing: 'border-box', borderBottom: `1px solid ${th.border}`, width: widths.reduce((a, w) => a + w, 0) }}>
                {(() => {
                  const merged = new Set<string>(Array.isArray(props.mergeRight) ? props.mergeRight.map((x: string) => x.replace(/\s/g, '')) : []);
                  const out: React.ReactNode[] = [];
                  for (let c = 0; c < widths.length; c++) {
                    let span = widths[c];
                    let last = c;
                    while (merged.has(`${r},${last}`) && last + 1 < widths.length) { last++; span += widths[last]; }
                    out.push(
                      <div key={c} style={{ width: span, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {props.cellData?.[r]?.[c] || ''}
                      </div>
                    );
                    c = last;
                  }
                  return out;
                })()}
              </div>
            ))}
            {overflowY && <div style={{ position: 'absolute', right: 4, top: 4, width: 4, height: '45%', borderRadius: 2, backgroundColor: th.border }} />}
          </div>
        );
}
