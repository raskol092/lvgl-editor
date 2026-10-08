import React from 'react';
import type { RenderCtx } from '../types';

export function renderCalendar(ctx: RenderCtx): React.ReactNode {
  const { props, defaultStyle, th, resolvedBgColor } = ctx;
        // like LVGL: weekday row + full month grid, neighbouring months dimmed, "today" boxed
        const year = Number(props.year ?? 2024);
        const month = Number(props.month ?? 1);
        const first = new Date(year, month - 1, 1).getDay();
        const daysIn = new Date(year, month, 0).getDate();
        const prevDays = new Date(year, month - 1, 0).getDate();
        const cells = Array.from({ length: 42 }).map((_, i) => {
          const dn = i - first + 1;
          if (dn < 1) return { n: prevDays + dn, other: true };
          if (dn > daysIn) return { n: dn - daysIn, other: true };
          return { n: dn, other: false };
        });
        // LVGL always shows 6 weeks (42 days), so the grid runs on into the next month
        return (
          <div className="lvgl-calendar" style={{
            width: '100%',
            height: '100%',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: resolvedBgColor === 'transparent' ? th.surface : undefined,
            border: !defaultStyle.borderWidth ? `1px solid ${th.border}` : undefined,
            borderRadius: defaultStyle.borderRadius || 4,
            boxSizing: 'border-box',
            overflow: 'hidden',
            color: th.text,
          }}>
            {(props.headerMode === 'arrow' || props.headerMode === 'dropdown') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', gap: 8 }}>
                {props.headerMode === 'arrow' ? (
                  <>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: th.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</span>
                    <span>{year} {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][(month - 1 + 12) % 12]}</span>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: th.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</span>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, border: `2px solid ${th.border}`, borderRadius: 8, padding: '6px 12px', display: 'flex', justifyContent: 'space-between' }}><span>{year}</span><span>⌄</span></span>
                    <span style={{ flex: 1, border: `2px solid ${th.border}`, borderRadius: 8, padding: '6px 12px', display: 'flex', justifyContent: 'space-between' }}><span>{String(month).padStart(2, '0')}</span><span>⌄</span></span>
                  </>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: '1px', flex: 1, padding: '2px' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ textAlign: 'center', alignSelf: 'center' }}>{d}</div>
              ))}
              {cells.map((c, i) => {
                const today = !c.other && props.showToday && c.n === Number(props.todayDay ?? 1) && Number(props.todayMonth ?? month) === month && Number(props.todayYear ?? year) === year;
                return (
                  <div key={i} style={{
                    justifySelf: 'center', alignSelf: 'center',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 3,
                    border: today ? `2px solid ${th.primary}` : c.other ? '1px solid transparent' : `1px solid ${th.border}`,
                    boxSizing: 'border-box',
                    opacity: c.other ? 0.7 : 1,
                  }}>{c.n}</div>
                );
              })}
            </div>
          </div>
        );
}
