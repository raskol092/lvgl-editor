import React from 'react';
import type { RenderCtx } from '../types';
import { getArcStyle } from '../../../../utils/arcStyle';

export function renderArc(ctx: RenderCtx): React.ReactNode {
  const { component, props } = ctx;
        // same geometry as LVGL: angles in degrees, 0 = 3 o'clock, clockwise
        const arc = getArcStyle(component);
        const size = Math.max(1, Math.min(component.width, component.height));
        const stroke = Math.min(48, (arc.width * 100) / size);
        const r = 50 - stroke / 2;
        const start = Number(props.startAngle ?? 135) + Number(props.rotation ?? 0);
        const end = Number(props.endAngle ?? 45) + Number(props.rotation ?? 0);
        const total = (((end - start) % 360) + 360) % 360 || 360;
        const min = Number(props.min ?? 0);
        const max = Number(props.max ?? 100);
        const frac = max > min ? Math.max(0, Math.min(1, (Number(props.value ?? 60) - min) / (max - min))) : 0;
        const pt = (deg: number): [number, number] => [50 + r * Math.cos((deg * Math.PI) / 180), 50 + r * Math.sin((deg * Math.PI) / 180)];
        const arcPath = (sweep: number) => {
          if (sweep <= 0.01) return '';
          if (sweep >= 359.99) return `M ${50 + r} 50 A ${r} ${r} 0 1 1 ${50 - r} 50 A ${r} ${r} 0 1 1 ${50 + r} 50`;
          const [x0, y0] = pt(start);
          const [x1, y1] = pt(start + sweep);
          return `M ${x0} ${y0} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x1} ${y1}`;
        };
        const [kx, ky] = pt(start + total * frac);
        return (
          <div className="lvgl-arc" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <path d={arcPath(total)} fill="none" stroke={arc.track} strokeWidth={stroke} strokeLinecap={props.rounded === false ? 'butt' : 'round'} />
              {frac > 0 && <path d={arcPath(total * frac)} fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap={props.rounded === false ? 'butt' : 'round'} />}
              {props.hideKnob !== true && <circle cx={kx} cy={ky} r={stroke * 0.7} fill={component.styles.knob?.bgColor || arc.color} />}
            </svg>
          </div>
        );
}
