/**
 * Builds the "P4 Dashboard" example project (a port of hwconf/p4_dashboard/lisp/nav_test.lisp of the P4 firmware):
 *   npx vite-node examples/p4-dashboard/build.ts
 * Writes p4-dashboard.lvgl.json (File -> Import in the editor) and the generated Lisp (main.lisp + ui/).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// the i18n module reads the language from localStorage
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0,
};

const { getNodeDefinition } = await import('../../src/components/LogicEditor/nodeDefinitions');
const { generateCode } = await import('../../src/codegen/lisp');
type Comp = import('../../src/types').LvglComponent;
type Node = import('../../src/components/LogicEditor/types').LogicNode;

const OUT = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------------ palette (nav_test.lisp section 4)
const C = {
  BG: '#0B0F14', CARD: '#161D27', LINE: '#243041', TEXT: '#E8EEF5', MUTED: '#8696A8',
  BLUE: '#2F80ED', GREEN: '#27AE60', ORANGE: '#F2994A', RED: '#EB5757', PURPLE: '#9B51E0',
};

// ------------------------------------------------------------------ component helpers
let seq = 0;
const uid = (p: string) => `${p}-${++seq}`;
function base(type: string, name: string, x: number, y: number, w: number, h: number, props: Record<string, unknown>, style: Record<string, unknown>): Comp {
  return {
    id: uid(type), type, name, x, y, width: w, height: h, children: [], props,
    styles: { default: { borderWidth: 0, padding: 0, opacity: 1, ...style } },
    events: [], animations: [], parentId: null, locked: false, visible: true,
  } as Comp;
}
const label = (name: string, text: string, size: number, col: string, x: number, y: number, w = 300): Comp =>
  base('label', name, x, y, w, size + 8, { text, fontSize: size }, { bgColor: 'transparent', textColor: col });
const panel = (name: string, x: number, y: number, w: number, h: number, col: string, kids: Comp[] = []): Comp => {
  const p = base('obj', name, x, y, w, h, {}, { bgColor: col, borderRadius: 14 });
  p.children = kids.map(k => ({ ...k, parentId: p.id }));
  return p;
};
const bar = (name: string, x: number, y: number, w: number, h: number, v: number, col: string, min = 0, max = 100): Comp =>
  base('bar', name, x, y, w, h, { min, max, value: v, indicatorColor: col }, { bgColor: C.LINE, borderRadius: h / 2 });
const ring = (name: string, x: number, y: number, d: number, w: number, v: number, col: string): Comp =>
  base('arc', name, x, y, d, d, { min: 0, max: 100, value: v, startAngle: 135, endAngle: 45, arcWidth: w, arcColor: col, arcTrackColor: C.LINE, hideKnob: true }, { bgColor: 'transparent' });
const chart = (name: string, x: number, y: number, w: number, h: number, type: 'line' | 'bar', data: number[], col: string): Comp =>
  base('chart', name, x, y, w, h, { type, series: [{ name: 'Series 1', data, color: col, lineWidth: 3, pointSize: 0 }], yAxisMin: 0, yAxisMax: 100, xLabels: [] },
    { bgColor: C.CARD, borderRadius: 12, paddingTop: 14, paddingBottom: 14, paddingLeft: 12, paddingRight: 12 });
const led = (name: string, x: number, y: number, col: string, on: boolean): Comp =>
  base('led', name, x, y, 14, 14, { color: col, checked: on, brightness: 255 }, { borderRadius: 9999 });
const sw = (name: string, x: number, y: number, on: boolean): Comp =>
  base('switch', name, x, y, 64, 32, { checked: on }, {});
const card = (name: string, x: number, y: number, w: number, h: number, title: string, value: string, unit: string, col: string): Comp =>
  panel(name, x, y, w, h, C.CARD, [
    label(`${name}_title`, title, 14, C.MUTED, 16, 12, w - 32),
    label(`${name}_value`, value, 32, col, 16, 38, w - 32),
    label(`${name}_unit`, unit, 16, C.MUTED, 16, 80, w - 32),
  ]);
const title = (name: string, text: string) => label(name, text, 20, C.MUTED, 28, 20, 600);

// ------------------------------------------------------------------ pages
const screens: Array<{ name: string; comps: Comp[] }> = [];
const add = (name: string, comps: Comp[]) => screens.push({ name, comps });

add('main1_speed', [
  title('m1p1_title', 'MAIN 1  /  PAGE 1   SPEED'),
  ring('speed_ring', 40, 70, 340, 26, 40, C.BLUE),
  label('speed_label', '24', 48, C.TEXT, 150, 200, 120),
  label('speed_unit', 'km/h', 20, C.MUTED, 160, 262, 100),
  card('battery_card', 420, 70, 170, 120, 'BATTERY', '78 %', '51.2 V', C.GREEN),
  card('range_card', 606, 70, 170, 120, 'RANGE', '41', 'km', C.TEXT),
  card('trip_card', 420, 206, 356, 120, 'TRIP', '12.6', 'km   0:38 h', C.TEXT),
  bar('battery_bar', 420, 350, 356, 14, 78, C.GREEN),
  label('odo_label', 'ODO 3412 km', 16, C.MUTED, 420, 378, 200),
]);
add('main1_charts', [
  title('m1p2_title', 'MAIN 1  /  PAGE 2   CHARTS'),
  label('power_caption', 'POWER, kW', 14, C.MUTED, 28, 58, 200),
  chart('power_chart', 24, 80, 370, 170, 'line', [10, 25, 40, 35, 60, 72, 55, 80, 66, 40, 30, 45], C.ORANGE),
  label('current_caption', 'CURRENT, A', 14, C.MUTED, 410, 58, 200),
  chart('current_chart', 406, 80, 370, 170, 'bar', [30, 50, 70, 45, 85, 60, 40, 20], C.BLUE),
  label('temp_caption', 'TEMPERATURE, C', 14, C.MUTED, 28, 266, 200),
  chart('temp_chart', 24, 288, 752, 140, 'line', [20, 22, 25, 30, 34, 38, 41, 44, 46, 45, 43, 40, 38, 36, 35, 34], C.RED),
]);
add('main1_temperature', [
  title('m1p3_title', 'MAIN 1  /  PAGE 3   TEMPERATURE & POWER'),
  card('motor_card', 24, 64, 240, 120, 'MOTOR', '62 C', 'limit 110 C', C.ORANGE),
  card('controller_card', 280, 64, 240, 120, 'CONTROLLER', '48 C', 'limit 85 C', C.TEXT),
  card('pack_card', 536, 64, 240, 120, 'BATTERY', '31 C', 'limit 60 C', C.GREEN),
  bar('motor_bar', 40, 170, 208, 6, 56, C.ORANGE),
  bar('controller_bar', 296, 170, 208, 6, 56, C.BLUE),
  bar('pack_bar', 552, 170, 208, 6, 52, C.GREEN),
  panel('power_panel', 24, 204, 752, 220, C.CARD, [
    label('power_title', 'POWER', 16, C.MUTED, 20, 16, 200),
    label('power_value', '3.48 kW', 48, C.PURPLE, 20, 46, 400),
    label('power_peak', 'peak 7.9 kW   regen 1.2 kW', 16, C.MUTED, 20, 112, 400),
    ring('power_ring', 520, 20, 180, 20, 64, C.PURPLE),
    bar('power_bar', 20, 160, 440, 16, 44, C.PURPLE),
  ]),
]);
const settingRow = (n: string, y: number, text: string, on: boolean): Comp[] => [
  panel(`${n}_panel`, 24, y, 752, 64, C.CARD),
  label(`${n}_label`, text, 20, C.TEXT, 48, y + 20, 400),
  sw(`${n}_switch`, 680, y + 16, on),
];
add('main2_settings', [
  title('m2p1_title', 'MAIN 2  /  PAGE 1   SETTINGS'),
  ...settingRow('units', 64, 'Units: km/h', true),
  ...settingRow('brightness', 138, 'Auto brightness', false),
  ...settingRow('sounds', 212, 'Sounds', true),
  panel('speed_limit_panel', 24, 286, 752, 130, C.CARD),
  label('max_speed_caption', 'Max speed', 20, C.TEXT, 48, 302, 300),
  label('max_speed_label', '45 km/h', 20, C.BLUE, 620, 302, 140),
  base('slider', 'max_speed_slider', 56, 346, 680, 14, { min: 10, max: 90, value: 45, indicatorColor: C.BLUE }, { bgColor: C.LINE, borderRadius: 7 }),
  bar('max_speed_bar', 56, 388, 680, 8, 45, C.BLUE, 10, 90),
]);
add('main2_statistics', [
  title('m2p2_title', 'MAIN 2  /  PAGE 2   STATISTICS'),
  card('trips_card', 24, 64, 176, 120, 'TRIPS', '128', 'total', C.TEXT),
  card('distance_card', 216, 64, 176, 120, 'DISTANCE', '3412', 'km', C.BLUE),
  card('avg_card', 408, 64, 176, 120, 'AVG SPEED', '27.4', 'km/h', C.GREEN),
  card('energy_card', 600, 64, 176, 120, 'ENERGY', '19.6', 'Wh/km', C.ORANGE),
  label('days_caption', 'DISTANCE BY DAY, km', 14, C.MUTED, 28, 200, 300),
  chart('days_chart', 24, 222, 752, 206, 'bar', [32, 18, 44, 60, 25, 70, 52], C.GREEN),
]);
const diag = (n: string, y: number, name: string, state: string, col: string, on: boolean): Comp[] => [
  led(`${n}_led`, 44, y + 6, col, on),
  label(`${n}_name`, name, 20, C.TEXT, 76, y, 400),
  label(`${n}_state`, state, 20, col, 600, y, 120),
];
add('main2_diagnostics', [
  title('m2p3_title', 'MAIN 2  /  PAGE 3   DIAGNOSTICS'),
  panel('diag_panel', 24, 60, 752, 300, C.CARD),
  ...diag('can', 80, 'CAN bus', 'OK', C.GREEN, true),
  ...diag('bms', 120, 'BMS link', 'OK', C.GREEN, true),
  ...diag('hall', 160, 'Motor hall sensors', 'WARN', C.ORANGE, true),
  ...diag('throttle', 200, 'Throttle input', 'OK', C.GREEN, true),
  ...diag('sd', 240, 'SD card', 'FAIL', C.RED, true),
  ...diag('fw', 280, 'Firmware', '6.05', C.MUTED, false),
  label('uptime_caption', 'UPTIME', 14, C.MUTED, 28, 378, 200),
  label('uptime_label', '0 s', 32, C.TEXT, 28, 398, 300),
]);

// navigation buttons (the board uses swipes; the editor has no gestures, so every screen gets Prev / Next)
screens.forEach((s, i) => {
  const mk = (name: string, text: string, x: number, target: string) => {
    const b = base('btn', name, x, 436, 110, 36, { text, fontSize: 16 }, { bgColor: C.LINE, textColor: C.TEXT, borderRadius: 12 });
    b.events = [{ id: uid('ev'), eventType: 'LV_EVENT_CLICKED', handlerType: 'builtin', action: { type: 'navigate', targetPage: target } }] as Comp['events'];
    return b;
  };
  s.comps.push(
    mk(`${s.name}_prev`, '<  Prev', 24, screens[(i + screens.length - 1) % screens.length].name),
    mk(`${s.name}_next`, 'Next  >', 666, screens[(i + 1) % screens.length].name),
  );
});

// ------------------------------------------------------------------ logic
function node(subType: string, id: string, x: number, y: number, params: Record<string, unknown>): Node {
  const def = getNodeDefinition(subType)!;
  return {
    id, type: def.type, subType, label: def.label, position: { x, y }, params: { ...def.defaultParams, ...params },
    inputs: def.inputs.map((p, i) => ({ ...p, id: `${id}-in-${i}` })),
    outputs: def.outputs.map((p, i) => ({ ...p, id: `${id}-out-${i}` })),
  } as Node;
}
const out = (n: Node, name: string) => n.outputs.find(p => p.name === name)!.id;
const inp = (n: Node, name: string) => n.inputs.find(p => p.name === name)!.id;
const wire = (a: Node, an: string, b: Node, bn: string, type: 'execution' | 'data' = 'execution') =>
  ({ id: uid('c'), sourceNode: a.id, sourceOutput: out(a, an), targetNode: b.id, targetInput: inp(b, bn), type });
const byName = (n: string) => screens.flatMap(s => s.comps.flatMap(c => [c, ...c.children])).find(c => c.name === n)!.id;
const graphs = [] as import('../../src/components/LogicEditor/types').LogicGraph[];
const graph = (id: string, name: string, nodes: Node[], connections: ReturnType<typeof wire>[], variables: unknown[] = []) =>
  graphs.push({ id, name, description: '', nodes, connections, variables } as never);
const withDefault = (n: Node, input: string, value: unknown) => { n.inputs.find(p => p.name === input)!.defaultValue = value as never; return n; };

{ // slider -> "45 km/h" caption: event trigger, Get value -> Number to text -> join with " km/h" -> Set text
  const t = node('event_trigger', 'g1t', 60, 80, { eventType: 'LV_EVENT_VALUE_CHANGED', targetComponent: byName('max_speed_slider') });
  const g = node('get_property', 'g1g', 60, 220, { targetComponent: byName('max_speed_slider'), property: 'value' });
  const n = node('to_string', 'g1n', 300, 220, { format: '%d' });
  const j = withDefault(node('string_op', 'g1j', 540, 220, { operation: 'concat' }), 'B', ' km/h');
  const s = node('set_text', 'g1s', 780, 80, { targetComponent: byName('max_speed_label') });
  graph('graph-max-label', 'Max speed caption', [t, g, n, j, s], [
    wire(t, 'Exec', s, 'Exec'), wire(g, 'Value', n, 'Value', 'data'), wire(n, 'Result', j, 'A', 'data'), wire(j, 'Result', s, 'Text', 'data'),
  ]);
}
{ // slider value -> progress bar, no trigger: the graph runs live
  const g = node('get_property', 'g2g', 60, 80, { targetComponent: byName('max_speed_slider'), property: 'value' });
  const s = node('set_value', 'g2s', 380, 80, { targetComponent: byName('max_speed_bar') });
  graph('graph-max-bar', 'Max speed bar follows the slider', [g, s], [wire(g, 'Value', s, 'Number', 'data')]);
}
{ // uptime counter, every second: seconds = seconds + 1, label = seconds + " s"
  const v = { id: 'var-uptime', name: 'uptime', type: 'int', defaultValue: 0 };
  const t = node('timer_trigger', 'g3t', 60, 80, { mode: 'repeat', duration: 1000 });
  const r1 = node('var_read', 'g3r1', 60, 260, { variableName: 'uptime', variableId: v.id });
  const add = withDefault(node('math_op', 'g3a', 300, 260, { operator: '+' }), 'B', 1);
  add.inputs.forEach(i => { i.type = 'int'; });
  add.outputs.forEach(o => { o.type = 'int'; });
  const w = node('var_write', 'g3w', 540, 80, { variableName: 'uptime', variableId: v.id });
  const r2 = node('var_read', 'g3r2', 540, 300, { variableName: 'uptime', variableId: v.id });
  const n = node('to_string', 'g3n', 780, 300, { format: '%d' });
  const j = withDefault(node('string_op', 'g3j', 1020, 300, { operation: 'concat' }), 'B', ' s');
  const s = node('set_text', 'g3s', 1260, 80, { targetComponent: byName('uptime_label') });
  graph('graph-uptime', 'Uptime counter', [t, r1, add, w, r2, n, j, s], [
    wire(t, 'Exec', w, 'Exec'), wire(r1, 'Value', add, 'A', 'data'), wire(add, 'Result', w, 'Value', 'data'), wire(w, 'Done', s, 'Exec'),
    wire(r2, 'Value', n, 'Value', 'data'), wire(n, 'Result', j, 'A', 'data'), wire(j, 'Result', s, 'Text', 'data'),
  ], [v]);
}
{ // the failing SD card LED blinks
  const t = node('timer_trigger', 'g4t', 60, 80, { mode: 'repeat', duration: 500 });
  const h = node('show_hide', 'g4h', 360, 80, { targetComponent: byName('sd_led'), action: 'toggle' });
  graph('graph-sd-blink', 'SD card LED blinks', [t, h], [wire(t, 'Exec', h, 'Exec')]);
}

// ------------------------------------------------------------------ write
const pages = screens.map((s, i) => ({ id: `page-${i + 1}`, name: s.name, components: s.comps, backgroundColor: C.BG }));
const display = { width: 800, height: 480, colorDepth: 32, rotation: 0 };
const project = {
  version: '1.0.0', name: 'P4 Dashboard example', createdAt: 0, updatedAt: 0,
  canvasSize: { width: 800, height: 480 },
  pages: pages.map(p => ({ id: p.id, name: p.name, components: p.components, backgroundColor: p.backgroundColor })),
  resources: { images: [], fonts: [] }, variables: [], logicGraphs: graphs,
  codeGenOptions: { outputFormat: 'single-file', includeComments: true, useStaticAllocation: true, prefix: 'ui', indentSize: 4, indentStyle: 'spaces' },
  display,
  lvglConfig: { version: '9', colorFormat: 'ARGB8888', fontLarge: true, defaultFont: 'montserrat_14', useBuiltinSymbols: true, symbolFont: 'montserrat_14', memSize: 64 },
};
writeFileSync(join(OUT, 'p4-dashboard.lvgl.json'), JSON.stringify(project, null, 2));

const theme = { id: 'dark', name: 'Dark theme', colors: { primary: '#2F80ED', secondary: '#9B51E0', background: C.BG, surface: C.CARD, text: C.TEXT, border: C.LINE } };
const lisp = generateCode(pages as never, undefined, graphs, theme as never, [], [], 'montserrat_14', 14);
for (const [file, src] of Object.entries(lisp)) {
  const path = join(OUT, 'lisp', file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, src as string);
}
console.log('screens:', pages.length, 'graphs:', graphs.length, 'files:', Object.keys(lisp).join(', '));
