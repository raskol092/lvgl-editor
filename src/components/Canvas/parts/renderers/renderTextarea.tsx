import React from 'react';
import type { RenderCtx } from '../types';

export function renderTextarea(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, muted, resolvedBgColor } = ctx;
        return (
          <div className="lvgl-textarea" style={{
            width: '100%',
            height: '100%',
            fontSize: '12px',
            color: muted,
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            padding: '6px 8px',
            boxSizing: 'border-box',
          }}>
            {props.text || props.placeholder || 'Enter text...'}
          </div>
        );
}
