// Designer rendering of the widgets that are not part of the original set (roller, spinbox, keyboard, list, message box, scale).
// Each one follows how LVGL draws it with the default theme so the canvas matches the board.
import React from 'react';
import type { LvglComponent, ThemeColors } from '../../types';

interface Ctx {
  component: LvglComponent;
  th: ThemeColors;
  fontSize: number;
  tint: string;
  muted: string;
  textColor: string;
}

const optionList = (v: unknown, fallback: string[]): string[] => (Array.isArray(v) && v.length ? v.map(String) : fallback);

function Roller({ component, th, fontSize, textColor }: Ctx) {
  const p = component.props;
  const opts = optionList(p.options, ['Option 1', 'Option 2', 'Option 3']);
  const rows = Math.max(1, Number(p.visibleRows) || 3);
  const sel = Math.max(0, Math.min(opts.length - 1, Number(p.selected) || 0));
  const first = sel - Math.floor(rows / 2);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: textColor, fontSize }}>
      {Array.from({ length: rows }).map((_, r) => {
        const idx = first + r;
        const i = p.mode === 'infinite' ? ((idx % opts.length) + opts.length) % opts.length : idx;
        const text = i >= 0 && i < opts.length ? opts[i] : '';
        const selected = r === Math.floor(rows / 2);
        return (
          <div key={r} style={{
            flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: selected ? th.primary : 'transparent', color: selected ? '#ffffff' : textColor,
          }}>{text}</div>
        );
      })}
    </div>
  );
}

function Spinbox({ component, th, fontSize, textColor }: Ctx) {
  const p = component.props;
  const digits = Math.max(1, Number(p.digitCount) || 4);
  const dec = Math.max(0, Number(p.decimalPos) || 0);
  const value = Number(p.value) || 0;
  const signed = Number(p.min ?? 0) < 0;
  const sign = signed ? (value < 0 ? '-' : '+') : '';
  const abs = String(Math.abs(Math.round(value))).padStart(digits, '0').slice(-digits);
  const text = dec > 0 ? `${abs.slice(0, digits - dec)}.${abs.slice(digits - dec)}` : abs;
  const step = Math.max(1, Number(p.step) || 1);
  const stepDigits = Math.max(0, String(step).length - 1);
  // the digit the cursor stands on is counted from the right (decimal point not counted)
  const cursorFromRight = stepDigits;
  const chars = (sign + text).split('');
  let digitsSeen = 0;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 10px', color: textColor, fontSize, fontVariantNumeric: 'tabular-nums' }}>
      {chars.map((c, i) => {
        const isDigit = /\d/.test(c);
        let underline = false;
        if (isDigit) {
          const fromRight = digits - 1 - digitsSeen;
          underline = fromRight === cursorFromRight;
          digitsSeen++;
        }
        return <span key={i} style={underline ? { background: th.primary, color: '#ffffff' } : undefined}>{c}</span>;
      })}
    </div>
  );
}

// key maps of LVGL's keyboard (lv_keyboard.c)
const KEY_ROWS: Record<string, string[][]> = {
  text_lower: [['1#', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '⌫'], ['ABC', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '↵'], ['_', '-', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '.', ',', ':'], ['⌨', '◀', 'space', '▶', '✓']],
  text_upper: [['1#', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '⌫'], ['abc', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '↵'], ['_', '-', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', ',', ':'], ['⌨', '◀', 'space', '▶', '✓']],
  special: [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'], ['abc', '+', '-', '/', '*', '=', '%', '!', '?', '#', '<', '>'], ['\\', '@', '$', '(', ')', '{', '}', '[', ']', ';', '"', "'"], ['⌨', '◀', 'space', '▶', '✓']],
  number: [['1', '2', '3', '⌨'], ['4', '5', '6', '✓'], ['7', '8', '9', '⌫'], ['+/-', '0', '.', '◀', '▶']],
};

function Keyboard({ component, th, fontSize, textColor }: Ctx) {
  const rows = KEY_ROWS[String(component.props.mode)] || KEY_ROWS.text_lower;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: 4, boxSizing: 'border-box', color: textColor, fontSize }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: 'flex', gap: 4, flex: 1, minHeight: 0 }}>
          {row.map((k, i) => (
            <div key={i} style={{
              flex: k === 'space' ? 4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: th.surface, border: `1px solid ${th.border}`, borderRadius: 6, overflow: 'hidden',
            }}>{k}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function List({ component, th, fontSize, textColor }: Ctx) {
  const items = optionList(component.props.items, ['Item 1', 'Item 2', 'Item 3']);
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', color: textColor, fontSize }}>
      {items.map((it, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: `1px solid ${th.border}` }}>{it}</div>
      ))}
    </div>
  );
}

function Msgbox({ component, th, fontSize, textColor, tint }: Ctx) {
  const p = component.props;
  const buttons = optionList(p.buttons, []);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', color: textColor, fontSize, padding: 12, boxSizing: 'border-box', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
        <span style={{ flex: 1 }}>{p.title || ''}</span>
        {p.showClose !== false && <span style={{ width: 28, height: 24, borderRadius: 6, background: th.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</span>}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{p.text || ''}</div>
      {buttons.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {buttons.map((b, i) => (
            <span key={i} style={{ padding: '6px 14px', borderRadius: 6, background: tint, border: `1px solid ${th.border}` }}>{b}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ticks, labels and needle like lv_scale: straight (4 modes) or round (inner / outer). */
function Scale({ component, th, fontSize, textColor }: Ctx) {
  const p = component.props;
  const w = component.width;
  const h = component.height;
  const mode = String(p.mode || 'horizontal_bottom');
  const total = Math.max(2, Number(p.totalTicks) || 11);
  const every = Math.max(1, Number(p.majorEvery) || 5);
  const min = Number(p.min ?? 0);
  const max = Number(p.max ?? 100);
  const labels = p.showLabels !== false;
  const lineColor = textColor;
  const needle = p.needle === true;
  const needleValue = Math.max(min, Math.min(max, Number(p.needleValue ?? min)));
  const frac = max > min ? (needleValue - min) / (max - min) : 0;
  const ticks = Array.from({ length: total }, (_, i) => ({ i, major: i % every === 0, value: Math.round(min + ((max - min) * i) / (total - 1)) }));

  if (mode.startsWith('round')) {
    const size = Math.min(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = size / 2 - fontSize - 4;
    const start = Number(p.rotation ?? 135);
    const range = Number(p.angleRange ?? 270);
    const outer = mode === 'round_outer';
    const pt = (deg: number, rad: number): [number, number] => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)];
    const [ax, ay] = pt(start, r);
    const [bx, by] = pt(start + range, r);
    const nAngle = start + range * frac;
    const nLen = Math.min(Number(p.needleLength) || r - 6, r);
    const [nx, ny] = pt(nAngle, nLen);
    return (
      <svg className="lvgl-scale" width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', color: textColor, fontSize }}>
        <path d={`M ${ax} ${ay} A ${r} ${r} 0 ${range > 180 ? 1 : 0} 1 ${bx} ${by}`} fill="none" stroke={lineColor} strokeWidth={2} />
        {ticks.map(t => {
          const a = start + (range * t.i) / (total - 1);
          const len = t.major ? 10 : 6;
          const [x1, y1] = pt(a, r);
          const [x2, y2] = pt(a, outer ? r + len : r - len);
          const [lx, ly] = pt(a, outer ? r + len + fontSize * 0.9 : r - len - fontSize * 0.8);
          return (
            <g key={t.i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lineColor} strokeWidth={t.major ? 2 : 1} />
              {labels && t.major && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={lineColor} fontSize={fontSize * 0.8}>{t.value}</text>}
            </g>
          );
        })}
        {needle && <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={p.needleColor || '#EF4444'} strokeWidth={Number(p.needleWidth) || 3} strokeLinecap="round" />}
      </svg>
    );
  }

  const horizontal = mode.startsWith('horizontal');
  const tickSide = mode === 'horizontal_bottom' || mode === 'vertical_right' ? 1 : -1; // direction the ticks point
  const pad = fontSize + 12;
  const lineY = mode === 'horizontal_bottom' ? 6 : mode === 'horizontal_top' ? h - 6 : 0;
  const lineX = mode === 'vertical_right' ? 6 : mode === 'vertical_left' ? w - 6 : 0;
  const span = horizontal ? w - 2 * 4 : h - 2 * 4;
  return (
    <svg className="lvgl-scale" width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', color: textColor, fontSize }}>
      {horizontal ? <line x1={4} y1={lineY} x2={w - 4} y2={lineY} stroke={lineColor} strokeWidth={2} /> : <line x1={lineX} y1={4} x2={lineX} y2={h - 4} stroke={lineColor} strokeWidth={2} />}
      {ticks.map(t => {
        const pos = 4 + (span * t.i) / (total - 1);
        const len = (t.major ? 12 : 7) * tickSide;
        const lab = (t.major ? 12 : 7) * tickSide + tickSide * (horizontal ? fontSize * 0.8 : fontSize * 0.9);
        return horizontal ? (
          <g key={t.i}>
            <line x1={pos} y1={lineY} x2={pos} y2={lineY + len} stroke={lineColor} strokeWidth={t.major ? 2 : 1} />
            {labels && t.major && <text x={pos} y={lineY + lab} textAnchor="middle" dominantBaseline="middle" fill={lineColor} fontSize={fontSize * 0.8}>{t.value}</text>}
          </g>
        ) : (
          <g key={t.i}>
            <line x1={lineX} y1={h - pos} x2={lineX + len} y2={h - pos} stroke={lineColor} strokeWidth={t.major ? 2 : 1} />
            {labels && t.major && <text x={lineX + lab} y={h - pos} textAnchor="middle" dominantBaseline="middle" fill={lineColor} fontSize={fontSize * 0.8}>{t.value}</text>}
          </g>
        );
      })}
      {needle && (horizontal
        ? <line x1={4 + span * frac} y1={lineY} x2={4 + span * frac} y2={lineY + tickSide * (Number(p.needleLength) || pad)} stroke={p.needleColor || '#EF4444'} strokeWidth={Number(p.needleWidth) || 3} />
        : <line x1={lineX} y1={h - (4 + span * frac)} x2={lineX + tickSide * (Number(p.needleLength) || pad)} y2={h - (4 + span * frac)} stroke={p.needleColor || '#EF4444'} strokeWidth={Number(p.needleWidth) || 3} />)}
    </svg>
  );
}

const RENDERERS: Record<string, React.FC<Ctx>> = { roller: Roller, spinbox: Spinbox, keyboard: Keyboard, list: List, msgbox: Msgbox, scale: Scale };

/** Content of a widget from the extra set, or null when the type is not one of them. */
export function renderExtraWidget(ctx: Ctx): React.ReactNode | null {
  const R = RENDERERS[ctx.component.type];
  return R ? <R {...ctx} /> : null;
}
