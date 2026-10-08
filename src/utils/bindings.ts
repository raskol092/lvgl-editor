// Applies the bindings of a component to its properties using the default values of the logic variables
// (what the board shows right after start); used by the LVGL preview.
import type { ComponentBinding } from '../types';

interface Var { name: string; type: string; defaultValue: unknown }

function fmt(format: string, v: number): string {
  const m = /%(\.(\d+))?([df])/.exec(format);
  if (!m) return String(v);
  const body = m[3] === 'd' ? String(Math.trunc(v)) : v.toFixed(m[2] !== undefined ? Number(m[2]) : 6);
  return format.replace(m[0], body);
}

function test(b: ComponentBinding, v: number): boolean {
  const c = Number(b.compare) || 0;
  switch (b.op) {
    case '==': return v === c;
    case '!=': return v !== c;
    case '>': return v > c;
    case '<': return v < c;
    case '>=': return v >= c;
    case '<=': return v <= c;
    default: return !!v;
  }
}

export function applyBindingsToPreview(
  type: string,
  bindings: ComponentBinding[] | undefined,
  vars: Var[],
  props: Record<string, unknown>,
  flags: Record<string, boolean>,
): void {
  for (const b of bindings || []) {
    const v = vars.find(x => x.name === b.variable);
    if (!v) continue;
    const raw = v.defaultValue;
    const n = typeof raw === 'number' ? raw : typeof raw === 'boolean' ? (raw ? 1 : 0) : Number(raw) || 0;
    switch (b.kind) {
      case 'text':
        props.text = v.type === 'string' && !(b.format || '').trim() ? String(raw ?? '') : fmt((b.format || '').trim() || (v.type === 'float' ? '%.1f' : '%d'), n);
        break;
      case 'value':
        if (type === 'roller' || type === 'dropdown') props.selected = n;
        else if (type === 'led') props.brightness = n;
        else if (type === 'switch' || type === 'checkbox') props.checked = !!n;
        else props.value = n;
        break;
      case 'hidden': flags.hidden = test(b, n); break;
      case 'disabled': flags.disabled = test(b, n); break;
      default: props.checked = test(b, n);
    }
  }
}
