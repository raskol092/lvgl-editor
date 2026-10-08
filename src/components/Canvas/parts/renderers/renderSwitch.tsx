import React from 'react';
import type { RenderCtx } from '../types';

export function renderSwitch(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th } = ctx;
        return (
          <div className="lvgl-switch" style={{
            width: '100%',
            height: '100%',
            borderRadius: defaultStyle.borderRadius || 13,
            backgroundColor: props.checked ? th.primary : th.border,
            position: 'relative',
            minHeight: '20px',
          }}>
            <div style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              top: '50%',
              marginTop: '-10px',
              left: props.checked ? 'calc(100% - 23px)' : '3px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'left 0.2s',
            }} />
          </div>
        );
}
