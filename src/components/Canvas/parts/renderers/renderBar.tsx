import React from 'react';
import { indicatorSpan } from '../helpers';
import type { RenderCtx } from '../types';

export function renderBar(ctx: RenderCtx): React.ReactNode {
  const { component, props, defaultStyle, th } = ctx;
        const [bLeft, bWidth] = indicatorSpan(props, 60);
        return (
          <div className="lvgl-bar" style={{
            width: '100%',
            height: '100%',
            borderRadius: defaultStyle.borderRadius,
            overflow: 'hidden',
          }}>
            <div style={{
              marginLeft: `${bLeft}%`,
              width: `${bWidth}%`,
              height: '100%',
              backgroundColor: component.styles.indicator?.bgColor || props.indicatorColor || th.primary,
              borderRadius: defaultStyle.borderRadius,
              transition: 'width 0.15s',
            }} />
          </div>
        );
}
