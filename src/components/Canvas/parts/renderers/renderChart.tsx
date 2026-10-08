import React from 'react';
import type { RenderCtx } from '../types';

export function renderChart(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, resolvedBgColor } = ctx;
        const series = props.series || (props.data ? [{ data: props.data, color: props.lineColor || th.primary }] : [{ data: [10, 20, 30, 25, 40], color: th.primary }]);
        const isStacked = props.type === 'stacked';
        const isBar = props.type === 'bar' || isStacked;
        const showDivs = props.horDivs !== undefined || props.verDivs !== undefined ? true : props.showGrid !== false;
        const horDivs = Math.max(0, Math.round(Number(props.horDivs ?? (props.showGrid === false ? 0 : 3))));
        const verDivs = Math.max(0, Math.round(Number(props.verDivs ?? (props.showGrid === false ? 0 : 5))));
        const y2Min = Number(props.y2AxisMin ?? 0);
        const y2Max = Number(props.y2AxisMax ?? 100);
        const yMin = Number(props.yAxisMin ?? 0);
        const yMax = Number(props.yAxisMax ?? 100);
        const span = yMax > yMin ? yMax - yMin : 1;
        type Ser = { data?: number[]; color?: string; axis?: string };
        const pos = (v: number, i: number, n: number, sr?: Ser): [number, number] => {
          const sec = sr?.axis === 'secondary';
          const lo = sec ? y2Min : yMin;
          const sp = sec ? (y2Max > y2Min ? y2Max - y2Min : 1) : span;
          return [
            isBar ? ((i + 0.5) / n) * 100 : n > 1 ? (i / (n - 1)) * 100 : 50,
            100 - Math.max(0, Math.min(1, (v - lo) / sp)) * 100,
          ];
        };
        return (
          <div className="lvgl-chart" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            boxSizing: 'border-box',
            padding: defaultStyle.paddingTop ?? 10,
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* LVGL draws a 5 x 3 division grid */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {showDivs && verDivs > 0 && Array.from({ length: verDivs + 1 }, (_, i) => (
                  <line key={`v${i}`} x1={(i * 100) / verDivs} y1="0" x2={(i * 100) / verDivs} y2="100" stroke={th.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {showDivs && horDivs > 0 && Array.from({ length: horDivs + 1 }, (_, i) => (
                  <line key={`h${i}`} x1="0" y1={(i * 100) / horDivs} x2="100" y2={(i * 100) / horDivs} stroke={th.border} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
                {!isBar && (series as Ser[]).map((sr, si) => {
                  const d = sr.data || [];
                  return (
                    <polyline
                      key={si}
                      fill="none"
                      stroke={sr.color || th.primary}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      points={d.map((v, i) => pos(v, i, d.length, sr).join(',')).join(' ')}
                    />
                  );
                })}
              </svg>
              {(series as Ser[]).map((sr, si) =>
                (sr.data || []).map((v, i, arr) => {
                  const [x, y] = pos(v, i, arr.length, sr);
                  if (isStacked) {
                    const below = (series as Ser[]).slice(0, si).reduce((a, o) => a + (o.data?.[i] ?? 0), 0);
                    const [, yTop] = pos(v + below, i, arr.length, sr);
                    const [, yBot] = pos(below, i, arr.length, sr);
                    return <div key={`${si}-${i}`} style={{ position: 'absolute', left: `${x}%`, width: `${Math.max(3, 60 / arr.length)}%`, top: `${yTop}%`, bottom: `${100 - yBot}%`, transform: 'translateX(-50%)', backgroundColor: sr.color || th.primary }} />;
                  }
                  return isBar ? (
                    <div key={`${si}-${i}`} style={{
                      position: 'absolute', left: `${x}%`, width: `${Math.max(3, 60 / arr.length / series.length)}%`,
                      top: `${y}%`, bottom: 0, transform: 'translateX(-50%)',
                      backgroundColor: sr.color || th.primary,
                    }} />
                  ) : (
                    <div key={`${si}-${i}`} style={{
                      position: 'absolute', left: `${x}%`, top: `${y}%`, width: 8, height: 8, borderRadius: '50%',
                      transform: 'translate(-50%, -50%)', backgroundColor: sr.color || th.primary,
                    }} />
                  );
                })
              )}
            </div>
          </div>
        );
}
