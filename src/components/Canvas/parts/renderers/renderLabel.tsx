import React from 'react';
import type { RenderCtx } from '../types';

export function renderLabel(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, defaultFontSize, editing, textEditor } = ctx;
        return (
          editing ? textEditor(defaultStyle.textColor || th.text, props.fontSize || defaultFontSize) : <span className="lvgl-label" style={{
            color: defaultStyle.textColor || th.text,
            fontSize: props.fontSize || defaultFontSize,
          }}>{props.text || 'Label'}</span>
        );
}
