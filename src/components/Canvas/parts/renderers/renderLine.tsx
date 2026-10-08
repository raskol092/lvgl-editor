import React from 'react';
import type { RenderCtx } from '../types';

export function renderLine(ctx: RenderCtx): React.ReactNode {
  const { component, props, th } = ctx;
        // lv_line draws a polyline through its points (object coordinates); default color = theme text
        const pts: number[][] = Array.isArray(props.points) && props.points.length >= 2 ? props.points : [[0, 0], [component.width, 0]];
        const maxY = Math.max(...pts.map(pt => Number(pt?.[1]) || 0));
        const ptY = (pt: number[]) => (props.yInvert === true ? maxY - (Number(pt?.[1]) || 0) : Number(pt?.[1]) || 0);
        return (
          <svg className="lvgl-line" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <polyline
              fill="none"
              points={pts.map(pt => `${Number(pt?.[0]) || 0},${ptY(pt)}`).join(' ')}
              stroke={props.lineColor || th.text}
              strokeWidth={props.lineWidth ?? 2}
              strokeLinecap={props.rounded === false ? 'butt' : 'round'}
              strokeLinejoin={props.rounded === false ? 'miter' : 'round'}
              strokeDasharray={Number(props.dashWidth) > 0 ? `${props.dashWidth} ${props.dashGap ?? 4}` : undefined}
            />
          </svg>
        );
}
