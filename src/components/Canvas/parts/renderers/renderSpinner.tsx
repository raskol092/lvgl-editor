import React from 'react';
import type { RenderCtx } from '../types';
import { getArcStyle } from '../../../../utils/arcStyle';

export function renderSpinner(ctx: RenderCtx): React.ReactNode {
  const { component, props } = ctx;
        const arc = getArcStyle(component);
        const size = Math.max(1, Math.min(component.width, component.height));
        const stroke = Math.min(48, (arc.width * 100) / size);
        const r = 50 - stroke / 2;
        const circumference = 2 * Math.PI * r;
        return (
          <div className="lvgl-spinner" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', animation: `spin ${(props.speed || 1000) / 1000}s linear infinite` }}>
              <circle cx="50" cy="50" r={r} fill="none" stroke={arc.track} strokeWidth={stroke} />
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={`${((props.arcLength || 60) / 360) * circumference} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
}
