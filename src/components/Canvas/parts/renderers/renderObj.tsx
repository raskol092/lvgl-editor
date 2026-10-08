import React from 'react';
import type { RenderCtx } from '../types';

export function renderObj(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, children } = ctx;
        // Build layout styles for the container based on props.layout
        const layoutStyle: React.CSSProperties = {};
        if (props.layout === 'flex') {
          layoutStyle.display = 'flex';
          layoutStyle.flexDirection = (props.flexDirection === 'column' ? 'column' : 'row') as React.CSSProperties['flexDirection'];
          if (props.flexWrap === 'wrap' || props.flexWrap === true) {
            layoutStyle.flexWrap = 'wrap';
          } else if (props.flexWrap === 'wrap-reverse') {
            layoutStyle.flexWrap = 'wrap-reverse';
          }
          if (props.justifyContent) layoutStyle.justifyContent = props.justifyContent;
          if (props.alignItems) layoutStyle.alignItems = props.alignItems;
          if (props.alignContent) layoutStyle.alignContent = props.alignContent;
          // gap maps to lv_obj_set_style_pad_row/pad_column in codegen
          if (props.gap !== undefined && props.gap > 0) {
            layoutStyle.gap = `${props.gap}px`;
          }
        } else if (props.layout === 'grid') {
          layoutStyle.display = 'grid';
          // Parse grid template: "1fr 2fr 1fr" → CSS grid-template-columns
          if (props.gridColumns) layoutStyle.gridTemplateColumns = props.gridColumns;
          if (props.gridRows) layoutStyle.gridTemplateRows = props.gridRows;
          if (props.gridColumnGap || props.gridRowGap) {
            layoutStyle.gap = `${props.gridRowGap || 0}px ${props.gridColumnGap || 0}px`;
          }
        }
        return (
          <div className="lvgl-obj" style={{
            width: '100%',
            height: '100%',
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            position: 'relative',
            ...layoutStyle,
          }}>
            {children}
          </div>
        );
}
