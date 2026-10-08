import React from 'react';
import { indicatorSpan } from '../helpers';
import type { RenderCtx } from '../types';

export function renderSlider(ctx: RenderCtx): React.ReactNode {
  const { component, props, defaultStyle, th } = ctx;
        // like the LVGL default theme: the whole object is the track (its own background), the indicator
        // fills from the left in the primary color, the knob is a primary circle slightly taller than the track
        const sMin = props.min ?? 0;
        const sMax = props.max ?? 100;
        const sPct = sMax > sMin ? Math.max(0, Math.min(100, ((props.value ?? 50) - sMin) / (sMax - sMin) * 100)) : 0;
        const [sLeft, sWidth] = indicatorSpan(props, 50);
        const startKnob = props.mode === 'range';
        const sStartPct = sMax > sMin ? Math.max(0, Math.min(100, (Number(props.startValue ?? sMin) - sMin) / (sMax - sMin) * 100)) : 0;
        const knob = component.height * 1.3;
        const indColor = component.styles.indicator?.bgColor || props.indicatorColor || th.primary;
        const knobColor = component.styles.knob?.bgColor || props.indicatorColor || th.primary;
        return (
          <div className="lvgl-slider" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{
              marginLeft: `${sLeft}%`,
              width: `${sWidth}%`,
              height: '100%',
              backgroundColor: indColor,
              borderRadius: defaultStyle.borderRadius ?? 9999,
            }} />
            {startKnob && <div style={{
              position: 'absolute', top: '50%', left: `calc(${sStartPct}% - ${knob / 2}px)`, width: knob, height: knob,
              transform: 'translateY(-50%)', borderRadius: '50%', backgroundColor: knobColor,
            }} />}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: `calc(${sPct}% - ${knob / 2}px)`,
              width: knob,
              height: knob,
              transform: 'translateY(-50%)',
              borderRadius: '50%',
              backgroundColor: knobColor,
            }} />
          </div>
        );
}
