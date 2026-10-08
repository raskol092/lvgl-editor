import React from 'react';
import type { RenderCtx } from '../types';

export function renderTileview(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, tint } = ctx;
        return (
          <div className="lvgl-tileview" style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: `repeat(${props.cols || 2}, 1fr)`,
            gridTemplateRows: `repeat(${props.rows || 2}, 1fr)`,
            gap: '2px',
            backgroundColor: th.border,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            overflow: 'hidden',
          }}>
            {Array.from({ length: (props.rows || 2) * (props.cols || 2) }).map((_, i) => (
              <div key={i} style={{ backgroundColor: tint, border: `1px dashed ${th.border}` }} />
            ))}
          </div>
        );
}
