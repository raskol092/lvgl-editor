import React from 'react';
import { CanvasImageContent } from '../CanvasImageContent';
import type { RenderCtx } from '../types';

export function renderImg(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th } = ctx;
        return <CanvasImageContent src={props.src} recolor={defaultStyle.imageRecolor} iconColor={th.text} view={{ innerAlign: props.innerAlign, scaleX: props.scaleX, scaleY: props.scaleY, pivotX: props.pivotX, pivotY: props.pivotY }} />;
}
