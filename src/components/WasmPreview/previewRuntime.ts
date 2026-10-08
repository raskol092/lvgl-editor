// Makes the LVGL preview interactive: the runtime posts widget events, this module runs the editor's built-in
// actions and logic graphs (event / timer triggers, graphs without trigger) and applies the result to the live
// LVGL objects through the pv_* functions of the WASM build. It mirrors what the generated Lisp does on the board.
import type { LvglComponent, BuiltinAction, Page } from '../../types';
import type { LogicGraph, LogicNode, LogicVariable } from '../LogicEditor/types';

interface Wasm {
  ccall: (name: string, ret: string | null, types: string[], args: unknown[]) => unknown;
}

export interface RuntimeDeps {
  getWasm: () => Wasm | null;
  getPage: () => Page | undefined;
  getGraphs: () => LogicGraph[];
  navigate: (pageName: string) => void;
}

type Val = number | string | boolean;

const STYLE_KEYS: Record<string, string> = {
  bg_color: 'bgColor', border_color: 'borderColor', border_width: 'borderWidth', radius: 'borderRadius',
  text_color: 'textColor', bg_opa: 'bgOpa', translate_x: 'translateX', translate_y: 'translateY',
};

const toNum = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : Number(v) || 0);
const truthy = (v: unknown): boolean => (typeof v === 'string' ? v !== '' : !!v);

function flatten(cs: LvglComponent[], out: LvglComponent[] = []): LvglComponent[] {
  for (const c of cs) { out.push(c); flatten(c.children, out); }
  return out;
}

export function createPreviewRuntime(deps: RuntimeDeps) {
  const vars = new Map<string, Val>();
  const timers: number[] = [];
  const liveSig = new Map<string, string>();

  const call = (fn: string, types: string[], args: unknown[]) => deps.getWasm()?.ccall(fn, null, types, args);
  const callNum = (fn: string, types: string[], args: unknown[]): number => Number(deps.getWasm()?.ccall(fn, 'number', types, args)) || 0;

  const byName = (name: string | undefined) => flatten(deps.getPage()?.components || []).find(c => c.name === name || c.id === name);

  function initVars() {
    vars.clear();
    for (const g of deps.getGraphs()) for (const v of g.variables) if (!vars.has(v.name)) vars.set(v.name, initial(v));
  }
  function initial(v: LogicVariable): Val {
    const d = v.defaultValue;
    if (v.type === 'string') return String(d ?? '');
    if (v.type === 'bool') return !!d;
    return toNum(d);
  }

  // ------------------------------------------------------------ writes
  function setProperty(name: string | undefined, prop: string, value: Val) {
    const comp = byName(name);
    if (!comp) return;
    const id = comp.id;
    const n = toNum(value);
    switch (prop) {
      case 'x': case 'y': case 'width': case 'height': call('pv_set_geom', ['string', 'string', 'number'], [id, prop, n]); break;
      case 'opacity': case 'opa': call('pv_set_style', ['string', 'string'], [id, JSON.stringify({ opacity: n / 255 })]); break;
      case 'visible': call('pv_set_flag', ['string', 'string', 'number'], [id, 'hidden', truthy(value) ? 0 : 1]); break;
      case 'checked':
        if (comp.type === 'led') call('pv_set_value', ['string', 'number'], [id, truthy(value) ? 255 : 0]);
        else call('pv_set_state', ['string', 'string', 'number'], [id, 'checked', truthy(value) ? 1 : 0]);
        break;
      case 'text': call('pv_set_text', ['string', 'string'], [id, String(value)]); break;
      case 'value': call('pv_set_value', ['string', 'number'], [id, n]); break;
      default:
        if (STYLE_KEYS[prop]) {
          const key = STYLE_KEYS[prop];
          const v = /color/i.test(prop) ? String(value) : n;
          call('pv_set_style', ['string', 'string'], [id, JSON.stringify({ [key]: v })]);
        }
    }
  }

  function runAction(a: BuiltinAction) {
    const comp = byName(a.targetComponent);
    const id = comp?.id;
    switch (a.type) {
      case 'navigate': if (a.targetPage) deps.navigate(a.targetPage); break;
      case 'setProperty': if (a.property) setProperty(a.targetComponent, a.property, a.value as Val); break;
      case 'show': if (id) call('pv_set_flag', ['string', 'string', 'number'], [id, 'hidden', 0]); break;
      case 'hide': if (id) call('pv_set_flag', ['string', 'string', 'number'], [id, 'hidden', 1]); break;
      case 'enable': if (id) call('pv_set_state', ['string', 'string', 'number'], [id, 'disabled', 0]); break;
      case 'disable': if (id) call('pv_set_state', ['string', 'string', 'number'], [id, 'disabled', 1]); break;
      case 'setText': setProperty(a.targetComponent, 'text', String(a.value ?? '')); break;
      case 'setValue': setProperty(a.targetComponent, 'value', toNum(a.value)); break;
      case 'setState':
        if (id && a.property) call('pv_set_state', ['string', 'string', 'number'], [id, a.property, a.value === 'off' ? 0 : a.value === 'toggle' ? 2 : 1]);
        break;
      case 'setFlag':
        if (id && a.property) call('pv_set_flag', ['string', 'string', 'number'], [id, a.property, a.value === 'off' ? 0 : a.value === 'toggle' ? 2 : 1]);
        break;
    }
  }

  // ------------------------------------------------------------ logic expressions
  function inputOf(g: LogicGraph, node: LogicNode, name: string): Val {
    const port = node.inputs.find(i => i.name === name);
    if (!port) return 0;
    const conn = g.connections.find(k => k.targetNode === node.id && k.targetInput === port.id);
    const src = conn && g.nodes.find(n => n.id === conn.sourceNode);
    if (src) return evaluate(g, src);
    return port.defaultValue === undefined ? (port.type === 'string' ? '' : port.type === 'bool' ? false : 0) : (port.defaultValue as Val);
  }
  const isWired = (g: LogicGraph, node: LogicNode, name: string) => {
    const port = node.inputs.find(i => i.name === name);
    return !!port && g.connections.some(k => k.targetNode === node.id && k.targetInput === port.id);
  };

  let loopIndex = 0;

  function evaluate(g: LogicGraph, node: LogicNode): Val {
    const p = node.params || {};
    const A = () => inputOf(g, node, 'A');
    const B = () => inputOf(g, node, 'B');
    switch (node.subType) {
      case 'var_read': return vars.get(p.variableName || p.variableId) ?? 0;
      case 'math_op': {
        const a = toNum(A()), b = toNum(B());
        switch (p.operator || '+') {
          case '-': return a - b; case '*': return a * b; case '/': return b ? (Number.isInteger(a) && Number.isInteger(b) ? Math.trunc(a / b) : a / b) : 0;
          case '%': return b ? a % b : 0; case 'min': return Math.min(a, b); case 'max': return Math.max(a, b); case 'pow': return Math.pow(a, b);
          default: return a + b;
        }
      }
      case 'compare': {
        const a = A(), b = B();
        switch (p.operator || '==') {
          case '!=': return a != b; case '>': return toNum(a) > toNum(b); case '<': return toNum(a) < toNum(b); // eslint-disable-line eqeqeq
          case '>=': return toNum(a) >= toNum(b); case '<=': return toNum(a) <= toNum(b);
          default: return a == b; // eslint-disable-line eqeqeq
        }
      }
      case 'logic_op': {
        const op = p.operator || 'AND';
        if (op === 'NOT') return !truthy(A());
        return op === 'OR' ? truthy(A()) || truthy(B()) : truthy(A()) && truthy(B());
      }
      case 'string_op': {
        const op = p.operation || 'concat';
        if (op === 'length') return String(A()).length;
        return op === 'concat' ? String(A()) + String(B()) : String(A());
      }
      case 'map_range': {
        const v = toNum(inputOf(g, node, 'Value')), i0 = toNum(inputOf(g, node, 'In min')), i1 = toNum(inputOf(g, node, 'In max'));
        const o0 = toNum(inputOf(g, node, 'Out min')), o1 = toNum(inputOf(g, node, 'Out max'));
        return o0 + ((v - i0) * (o1 - o0)) / (i1 === i0 ? 1 : i1 - i0);
      }
      case 'clamp': {
        const v = toNum(inputOf(g, node, 'Value')), lo = toNum(inputOf(g, node, 'Min')), hi = toNum(inputOf(g, node, 'Max'));
        return v < lo ? lo : v > hi ? hi : v;
      }
      case 'math_func': {
        const a = toNum(A());
        const f: Record<string, (x: number) => number> = { abs: Math.abs, sqrt: Math.sqrt, floor: Math.floor, ceil: Math.ceil, round: Math.round, sin: Math.sin, cos: Math.cos };
        return (f[p.func] || Math.abs)(a);
      }
      case 'to_string': {
        const v = toNum(inputOf(g, node, 'Value'));
        const fmt = String(p.format || '%d');
        const m = /%(\.(\d+))?([df])/.exec(fmt);
        if (!m) return String(v);
        return fmt.replace(m[0], m[3] === 'd' ? String(Math.trunc(v)) : v.toFixed(m[2] !== undefined ? Number(m[2]) : 6));
      }
      case 'random': {
        const lo = toNum(inputOf(g, node, 'Min')), hi = toNum(inputOf(g, node, 'Max'));
        return lo + Math.floor(Math.random() * (hi - lo + 1));
      }
      case 'for_loop': return loopIndex;
      case 'get_property': {
        const comp = byName(p.targetComponent);
        if (!comp) return 0;
        switch (p.property) {
          case 'checked': return !!callNum('pv_has_state', ['string', 'number'], [comp.id, 0]);
          case 'value': return callNum('pv_get_value', ['string'], [comp.id]);
          case 'x': return comp.x; case 'y': return comp.y; case 'width': return comp.width; case 'height': return comp.height;
          default: return 0;
        }
      }
      default: return 0;
    }
  }

  // ------------------------------------------------------------ logic execution
  const nextExec = (g: LogicGraph, node: LogicNode, outName?: string): string | null => {
    const out = outName ? node.outputs.find(o => o.name === outName) : node.outputs.find(o => o.type === 'execution');
    if (!out) return null;
    return g.connections.find(c => c.sourceNode === node.id && c.sourceOutput === out.id)?.targetNode ?? null;
  };

  function runChain(g: LogicGraph, startId: string | null, guard = 0) {
    let id = startId;
    const seen = new Set<string>();
    while (id && guard < 500) {
      if (seen.has(id)) return;
      seen.add(id);
      guard++;
      const node = g.nodes.find(n => n.id === id);
      if (!node) return;
      const p = node.params || {};
      switch (node.subType) {
        case 'if_else': { runChain(g, nextExec(g, node, truthy(inputOf(g, node, 'Condition')) ? 'True' : 'False'), guard); return; }
        case 'switch': {
          const v = toNum(inputOf(g, node, 'Value'));
          const cases: unknown[] = p.cases || [0, 1, 2];
          const hit = cases.find(c => toNum(c) === v);
          runChain(g, (hit !== undefined && (nextExec(g, node, `Case ${hit}`) || nextExec(g, node, String(hit)))) || nextExec(g, node, 'Default'), guard);
          return;
        }
        case 'for_loop': {
          const n = toNum(inputOf(g, node, 'Count'));
          const saved = loopIndex;
          const body = nextExec(g, node, 'Body');
          for (let i = 0; i < n && i < 1000; i++) { loopIndex = i; runChain(g, body, guard); }
          loopIndex = saved;
          id = nextExec(g, node, 'Done');
          continue;
        }
        case 'delay': {
          const next = nextExec(g, node);
          if (next) timers.push(window.setTimeout(() => runChain(g, next), toNum(p.duration || 1000)));
          return;
        }
        case 'navigate_page': if (p.targetPage) deps.navigate(p.targetPage); break;
        case 'show_hide': {
          const comp = byName(p.targetComponent);
          if (comp) call('pv_set_flag', ['string', 'string', 'number'], [comp.id, 'hidden', (p.action || 'toggle') === 'show' ? 0 : p.action === 'hide' ? 1 : 2]);
          break;
        }
        case 'set_text': setProperty(p.targetComponent, 'text', String(inputOf(g, node, 'Text'))); break;
        case 'set_value': setProperty(p.targetComponent, 'value', toNum(inputOf(g, node, 'Number'))); break;
        case 'set_property': {
          const prop = p.property || 'x';
          const value = isWired(g, node, 'Value') ? inputOf(g, node, 'Value') : (p.value !== undefined ? p.value : 0);
          setProperty(p.targetComponent, prop, value);
          break;
        }
        case 'var_write': vars.set(p.variableName || p.variableId, inputOf(g, node, 'Value')); break;
        default: break;
      }
      id = nextExec(g, node);
    }
  }

  // ------------------------------------------------------------ public
  function handleEvent(compId: string, eventName: string) {
    const page = deps.getPage();
    if (!page) return;
    const comp = flatten(page.components).find(c => c.id === compId);
    if (!comp) return;
    for (const ev of comp.events || []) {
      if (ev.eventType === eventName && ev.handlerType === 'builtin' && ev.action) runAction(ev.action);
    }
    for (const g of deps.getGraphs()) {
      for (const n of g.nodes) {
        if (n.subType === 'event_trigger' && (n.params?.targetComponent === comp.name || n.params?.targetComponent === comp.id) && (n.params.eventType || 'LV_EVENT_CLICKED') === eventName) runChain(g, nextExec(g, n));
      }
    }
  }

  /** Called after the UI of a page was (re)loaded: starts timers and runs the graphs without trigger. */
  function start() {
    stop();
    if (vars.size === 0) initVars();
    for (const g of deps.getGraphs()) {
      const triggers = g.nodes.filter(n => n.type === 'trigger');
      for (const n of triggers) {
        if (n.subType !== 'timer_trigger') continue;
        const ms = Math.max(20, toNum(n.params?.duration || 1000));
        const run = () => runChain(g, nextExec(g, n));
        timers.push(n.params?.mode === 'delay' ? window.setTimeout(run, ms) : window.setInterval(run, ms));
      }
      if (triggers.length === 0 && g.nodes.some(n => n.type === 'action' || n.type === 'custom')) {
        const first = g.nodes.filter(n => n.type === 'action' || n.type === 'custom');
        const sig = () => JSON.stringify(first.flatMap(n => n.inputs.filter(i => i.type !== 'execution' && isWired(g, n, i.name)).map(i => inputOf(g, n, i.name))));
        const runAll = () => { for (const n of first) runOne(g, n); };
        liveSig.set(g.id, sig());
        runAll();
        timers.push(window.setInterval(() => { const s = sig(); if (s !== liveSig.get(g.id)) { liveSig.set(g.id, s); runAll(); } }, 50));
      }
    }
  }

  // a single node of a live graph (no exec wiring): run it as a one-node chain
  function runOne(g: LogicGraph, node: LogicNode) {
    const clone: LogicGraph = { ...g, connections: g.connections.filter(c => !(c.sourceNode === node.id && c.type === 'execution')) };
    runChain(clone, node.id);
  }

  function stop() {
    for (const t of timers) { window.clearTimeout(t); window.clearInterval(t); }
    timers.length = 0;
  }

  return { handleEvent, start, stop, resetVars: () => vars.clear() };
}
