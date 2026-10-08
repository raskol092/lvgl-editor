import React from 'react';
import type { RenderCtx } from '../types';

export function renderDropdown(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, muted, resolvedBgColor } = ctx;
        return (
          <div className="lvgl-dropdown" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '0 8px',
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            boxSizing: 'border-box',
            color: defaultStyle.textColor || th.text,
          }}>
            <span>{props.options?.[props.selected || 0] || 'Select...'}</span>
            <span style={{ color: muted, fontSize: '10px' }}>▼</span>
          </div>
        );
}
