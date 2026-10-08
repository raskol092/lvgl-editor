import React from 'react';
import type { RenderCtx } from '../types';

export function renderCheckbox(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, muted, defaultFontSize, editing, textEditor } = ctx;
        return (
          <div className="lvgl-checkbox" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: defaultStyle.textColor || th.text,
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${muted}`,
              borderRadius: '2px',
              backgroundColor: props.checked ? th.primary : th.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {props.checked && <span style={{ color: '#ffffff', fontSize: '12px', lineHeight: 1 }}>✓</span>}
            </div>
            {editing
              ? textEditor(defaultStyle.textColor || th.text, props.fontSize || defaultFontSize)
              : <span style={{ fontSize: defaultFontSize }}>{props.text || 'Checkbox'}</span>}
          </div>
        );
}
