import React from 'react';
import type { RenderCtx } from '../types';

export function renderWin(ctx: RenderCtx): React.ReactNode {
  const { props, th, tint, defaultFontSize, children } = ctx;
        // like lv_win: a header bar (default 40 px) with the title and square primary-colored buttons on the right
        const headerH = Number(props.headerHeight) || 40;
        const onPrimary = '#ffffff';
        const hdrBtns: string[] = [];
        if (props.showCloseBtn !== false) hdrBtns.push('✕');
        if (Array.isArray(props.headerButtons)) props.headerButtons.forEach(() => hdrBtns.push('⚙'));
        return (
          <div className="lvgl-win" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              height: headerH,
              padding: '4px 8px 4px 12px',
              boxSizing: 'border-box',
              backgroundColor: tint,
              fontSize: props.fontSize || defaultFontSize,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.title || 'Window'}</span>
              {hdrBtns.map((ic, i) => (
                <span key={i} style={{
                  width: 40,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  backgroundColor: th.primary,
                  color: onPrimary,
                  flexShrink: 0,
                }}>{ic}</span>
              ))}
            </div>
            <div className="lvgl-win-content" style={{ flex: 1, padding: '8px' }}>{children}</div>
          </div>
        );
}
