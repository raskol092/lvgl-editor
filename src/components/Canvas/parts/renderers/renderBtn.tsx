import React from 'react';
import type { RenderCtx } from '../types';

export function renderBtn(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, defaultFontSize, children, editing, textEditor } = ctx;
        return (
          <div className="lvgl-btn" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: defaultStyle.textColor || '#ffffff',
            fontSize: props.fontSize || defaultFontSize,
          }}>
            {children}
            {editing && textEditor(defaultStyle.textColor || '#ffffff', props.fontSize || defaultFontSize)}
            {!editing && (!children || React.Children.count(children) === 0) && (props.text || 'Button')}
          </div>
        );
}
