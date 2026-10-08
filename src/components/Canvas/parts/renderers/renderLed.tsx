import React from 'react';
import type { RenderCtx } from '../types';

export function renderLed(ctx: RenderCtx): React.ReactNode {
  const { component, props, th } = ctx;
        // lv_led: a circle in the LED color; "off" is dimmed (LVGL uses brightness 80 of 255), "on" glows
        const color = props.color || th.primary;
        const level = props.checked === false ? Math.min(80, Number(props.brightness ?? 255)) : Number(props.brightness ?? 255);
        const pct = Math.round((Math.max(0, Math.min(255, level)) / 255) * 100);
        return (
          <div className="lvgl-led" style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: `color-mix(in srgb, ${color} ${pct}%, #000000)`,
            border: `2px solid color-mix(in srgb, color-mix(in srgb, ${color} ${pct}%, #000000) 80%, #ffffff)`,
            boxSizing: 'border-box',
            boxShadow: props.checked === false ? undefined : `0 0 ${Math.max(6, component.width / 2)}px ${Math.round(component.width / 8)}px color-mix(in srgb, ${color} 70%, transparent)`,
          }} />
        );
}
