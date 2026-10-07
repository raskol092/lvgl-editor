import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { generateCode, getGeneratedFileNames } from '../index';
import type { LispGenOptions } from '../types';
import { lstr, lcolor, symbolBody } from '../sexp';
import {
  createPage, createComponent, createEvent, createBuiltinAction, createAnimation,
  createLogicNode, createLogicPort, createLogicGraph, createLogicConnection, createLogicVariable,
  createImageResource, createFontResource,
} from '../../__tests__/helpers';

/** Checks that parentheses/strings are balanced; returns an error message or null. */
function checkSyntax(src: string): string | null {
  let depth = 0;
  let line = 1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\n') line++;
    else if (ch === ';') { while (i < src.length && src[i] !== '\n') i++; line++; }
    else if (ch === '"') {
      i++;
      while (i < src.length && src[i] !== '"') { if (src[i] === '\\') i++; if (src[i] === '\n') line++; i++; }
      if (i >= src.length) return `unterminated string (line ${line})`;
    } else if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth < 0) return `extra ')' at line ${line}`; }
  }
  return depth === 0 ? null : `${depth} unclosed '('`;
}

function expectValid(files: object) {
  for (const [name, text] of Object.entries(files) as Array<[string, string]>) {
    expect(checkSyntax(text), name).toBeNull();
  }
}

const exec = (id: string, name = 'Exec') => createLogicPort({ id, name, type: 'execution' });

function sampleProject(opts: Partial<LispGenOptions> = {}) {
  const img = createImageResource({ id: 'img1', name: 'logo', cArrayName: 'img_logo' });
  const font = createFontResource({ cFontName: 'font_roboto' });
  const btn = createComponent('btn', {
    id: 'b1', name: 'start_btn', x: 10, y: 20, width: 120, height: 40,
    props: { text: 'Start "now"', fontResource: 'font_roboto', fontSize: 24 },
    styles: {
      default: { bgColor: '#2196F3', borderRadius: 8, padding: 4, borderSide: 'top_bottom' },
      pressed: { bgColor: '#1976D2' },
    },
    events: [
      createEvent({ id: 'e1', action: createBuiltinAction({ type: 'navigate', targetPage: 'settings' }) }),
      createEvent({ id: 'e2', eventType: 'LV_EVENT_LONG_PRESSED', handlerType: 'custom', customCode: '(print "long")\n;; trailing comment' }),
    ],
    animations: [createAnimation({ id: 'a1', property: 'x', startValue: 0, endValue: 100, easing: 'ease_in_out', repeat: 2 })],
  });
  const label = createComponent('label', { id: 'l1', name: 'status', props: { text: 'Hello\nWorld', longMode: 'wrap' } });
  const slider = createComponent('slider', { id: 's1', name: 'level', props: { min: 0, max: 10, value: 5 } });
  const chart = createComponent('chart', {
    id: 'c1', name: 'plot',
    props: { type: 'line', yAxisMin: 0, yAxisMax: 50, showGrid: false, series: [{ color: '#ff0000', data: [1, 2, 3] }, { data: [3, 2, 1, 0] }] },
  });
  const tabs = createComponent('tabview', { id: 't1', name: 'tabs', props: { tabs: ['A', 'B'], activeTab: 1 }, children: [
    createComponent('label', { id: 'l2', name: 'in_tab', parentId: 't1' }),
  ] });
  const image = createComponent('img', { id: 'i1', name: 'logo_img', props: { src: 'img1' } });
  const back = createComponent('btn', {
    id: 'b2', name: 'back', events: [createEvent({ id: 'e3', action: createBuiltinAction({ type: 'show', targetComponent: 'status' }) }),
      createEvent({ id: 'e4', eventType: 'LV_EVENT_VALUE_CHANGED', action: createBuiltinAction({ type: 'setValue', targetComponent: 'level', value: 7 }) })],
  });
  const pages = [
    createPage({ id: 'p1', name: 'main', backgroundColor: '#101010', components: [btn, label, slider, chart, tabs, image] }),
    createPage({ id: 'p2', name: 'settings', components: [back] }),
  ];

  const trig = createLogicNode('event_trigger', { id: 'n1', params: { eventType: 'LV_EVENT_CLICKED', targetComponent: 'start_btn' }, outputs: [exec('n1o')] });
  const cmp = createLogicNode('compare', { id: 'n2', params: { operator: '>' }, inputs: [createLogicPort({ id: 'n2a', name: 'A', type: 'int' }), createLogicPort({ id: 'n2b', name: 'B', type: 'int', defaultValue: 3 })], outputs: [createLogicPort({ id: 'n2o', name: 'Result', type: 'bool' })] });
  const read = createLogicNode('var_read', { id: 'n3', params: { variableName: 'Counter' }, outputs: [createLogicPort({ id: 'n3o', name: 'Value', type: 'int' })] });
  const ifelse = createLogicNode('if_else', { id: 'n4', inputs: [exec('n4i'), createLogicPort({ id: 'n4c', name: 'Condition', type: 'bool' })], outputs: [exec('n4t', 'True'), exec('n4f', 'False')] });
  const hide = createLogicNode('show_hide', { id: 'n5', params: { targetComponent: 'status', action: 'toggle' }, inputs: [exec('n5i')], outputs: [exec('n5o', 'Done')] });
  const write = createLogicNode('var_write', { id: 'n6', params: { variableName: 'Counter' }, inputs: [exec('n6i'), createLogicPort({ id: 'n6v', name: 'Value', type: 'int', defaultValue: 1 })], outputs: [exec('n6o', 'Done')] });
  const timer = createLogicNode('timer_trigger', { id: 'n7', params: { mode: 'repeat', duration: 500 }, outputs: [exec('n7o')] });
  const text = createLogicNode('set_text', { id: 'n8', params: { targetComponent: 'status' }, inputs: [exec('n8i'), createLogicPort({ id: 'n8t', name: 'Text', type: 'string', defaultValue: 'tick' })], outputs: [exec('n8o', 'Done')] });
  const g1 = createLogicGraph({
    id: 'g1', name: 'On Click',
    nodes: [trig, read, cmp, ifelse, hide, write],
    connections: [
      createLogicConnection({ sourceNode: 'n1', sourceOutput: 'n1o', targetNode: 'n4', targetInput: 'n4i' }),
      createLogicConnection({ sourceNode: 'n3', sourceOutput: 'n3o', targetNode: 'n2', targetInput: 'n2a', type: 'data' }),
      createLogicConnection({ sourceNode: 'n2', sourceOutput: 'n2o', targetNode: 'n4', targetInput: 'n4c', type: 'data' }),
      createLogicConnection({ sourceNode: 'n4', sourceOutput: 'n4t', targetNode: 'n5', targetInput: 'n5i' }),
      createLogicConnection({ sourceNode: 'n4', sourceOutput: 'n4f', targetNode: 'n6', targetInput: 'n6i' }),
    ],
    variables: [createLogicVariable({ name: 'Counter', type: 'int', defaultValue: 2 })],
  });
  const g2 = createLogicGraph({ id: 'g2', name: 'Blink', nodes: [timer, text], connections: [createLogicConnection({ sourceNode: 'n7', sourceOutput: 'n7o', targetNode: 'n8', targetInput: 'n8i' })] });
  return generateCode(pages, opts, [g1, g2], undefined, [img], [font], 'font_roboto', 16);
}

describe('helpers', () => {
  it('quotes strings', () => {
    expect(lstr('a"b\\c\nd')).toBe('"a\\"b\\\\c\\nd"');
  });
  it('converts colors', () => {
    expect(lcolor('#2196f3')).toBe('0x2196F3');
    expect(lcolor('#fff')).toBe('0xFFFFFF');
    expect(lcolor('nope')).toBe('0x000000');
  });
  it('builds symbols in both styles', () => {
    expect(symbolBody('MyButton_ec0e', { namingStyle: 'kebab-case' })).toBe('my-button-ec0e');
    expect(symbolBody('MyButton 1', { namingStyle: 'snake_case' })).toBe('my_button_1');
    expect(symbolBody('1st', { namingStyle: 'kebab-case' })).toBe('n-1st');
  });
});

describe('project layout', () => {
  it('produces main.lisp plus the ui/ folder', () => {
    expect(getGeneratedFileNames()).toEqual(['main.lisp', 'ui/ui.lisp', 'ui/ui_events.lisp', 'ui/ui_logic.lisp']);
    expect(Object.keys(generateCode([]))).toEqual(getGeneratedFileNames());
  });

  it('every file is balanced Lisp (empty and full project)', () => {
    expectValid(generateCode([]));
    expectValid(generateCode([createPage({ name: 'main' })]));
    expectValid(sampleProject());
    expectValid(sampleProject({ namingStyle: 'snake_case', generateComments: false, userCodeMarkers: false }));
  });

  it('dumps the sample project when LISP_DUMP is set', () => {
    const out = process.env.LISP_DUMP;
    if (!out) return;
    const files = sampleProject();
    for (const [k, v] of Object.entries(files)) writeFileSync(`${out}/${k.replace('/', '__')}`, v);
  });
});

describe('main.lisp', () => {
  const main = sampleProject()['main.lisp'];
  it('imports and evaluates the ui files', () => {
    for (const f of ['ui.lisp', 'ui_events.lisp', 'ui_logic.lisp']) expect(main).toContain(`(import "ui/${f}"`);
    expect(main).toContain('(read-eval-program ui-code)');
    expect(main).toContain('(ui-init)');
    expect(main).toContain('(ui-logic-init)');
    expect(main).toContain('(ui-run)');
  });
  it('imports used images and fonts as .bin resources', () => {
    expect(main).toContain(`(import "assets/img_logo.bin" 'ui-img-img-logo)`);
    expect(main).toContain(`(import "font/font_roboto_24.bin" 'ui-fontdata-font-roboto-24)`);
    expect(main).toContain(`(import "font/font_roboto_16.bin" 'ui-fontdata-font-roboto-16)`);
  });
});

describe('ui/ui.lisp', () => {
  const ui = sampleProject()['ui/ui.lisp'];
  it('creates screens and widgets through the bridge', () => {
    expect(ui).toContain('(def ui-screen-main (lv-obj-create nil))');
    expect(ui).toContain('(lv-obj-set-style-bg-color ui-screen-main 0x101010 LV_PART_MAIN)');
    expect(ui).toContain('(def ui-start-btn (lv-button-create ui-screen-main))');
    expect(ui).toContain('(lv-obj-set-pos ui-start-btn 10 20)');
    expect(ui).toContain('(lv-obj-set-size ui-start-btn 120 40)');
    expect(ui).toContain('(lv-label-set-text ui-start-btn-label "Start \\"now\\"")');
    expect(ui).toContain('(lv-label-set-text ui-status "Hello\\nWorld")');
  });
  it('applies state styles with the right selector', () => {
    expect(ui).toContain('(lv-obj-set-style-bg-color ui-start-btn 0x1976D2 LV_STATE_PRESSED)');
    expect(ui).toContain('(bitwise-or LV_BORDER_SIDE_TOP LV_BORDER_SIDE_BOTTOM)');
    expect(ui).toContain('(lv-obj-set-style-pad-left ui-start-btn 4 LV_PART_MAIN)');
  });
  it('registers event handlers by symbol', () => {
    expect(ui).toContain("(lv-obj-add-event-cb ui-start-btn 'ui-event-start-btn-clicked LV_EVENT_CLICKED)");
    expect(ui).toContain("'ui-event-start-btn-long-pressed LV_EVENT_LONG_PRESSED)");
  });
  it('handles tabs, charts, images and fonts', () => {
    expect(ui).toContain('(def ui-tabs-tab-0 (lv-tabview-add-tab ui-tabs "A"))');
    expect(ui).toContain('(def ui-in-tab (lv-label-create ui-tabs-tab-1))');
    expect(ui).toContain('(lv-chart-set-point-count ui-plot 4)');
    expect(ui).toContain('(lv-chart-set-series-values ui-plot ui-plot-ser-0 (list 1 2 3))');
    expect(ui).toContain('(lv-chart-set-div-line-count ui-plot 0 0)');
    expect(ui).toContain('(lv-image-set-vesc ui-logo-img ui-img-img-logo)');
    expect(ui).toContain('(def ui-font-font-roboto-24 (lv-font-load ui-fontdata-font-roboto-24))');
    expect(ui).toContain('(lv-obj-set-style-text-font ui-start-btn-label ui-font-font-roboto-24 LV_PART_MAIN)');
  });
  it('emits the animation runtime and starts animations', () => {
    expect(ui).toContain('(defun ui-anim-step ()');
    expect(ui).toContain("(ui-anim-add ui-start-btn 'x 0 100 500 0 'ease-in-out 2)");
  });
  it('defines screen loaders and ui-init', () => {
    expect(ui).toContain('(defun ui-load-screen-settings ()');
    expect(ui).toMatch(/\(defun ui-init \(\)[\s\S]*\(ui-init-screen-main\)[\s\S]*\(ui-load-screen-main\)/);
  });
  it('does not emit the runtime when there are no animations', () => {
    const files = generateCode([createPage({ components: [createComponent('btn')] })]);
    expect(files['ui/ui.lisp']).toContain('(defun ui-anim-step () nil)');
    expect(files['ui/ui.lisp']).not.toContain('ui-anim-add');
  });
  it('honours the snake_case style', () => {
    const ui2 = sampleProject({ namingStyle: 'snake_case' })['ui/ui.lisp'];
    expect(ui2).toContain('(def ui_start_btn (lv-button-create ui_screen_main))');
  });
  it('gives colliding names on different pages unique variables', () => {
    const files = generateCode([
      createPage({ name: 'a', components: [createComponent('label', { id: 'x1', name: 'title' })] }),
      createPage({ name: 'b', components: [createComponent('label', { id: 'x2', name: 'title' })] }),
    ]);
    expect(files['ui/ui.lisp']).toContain('(def ui-title (lv-label-create');
    expect(files['ui/ui.lisp']).toContain('(def ui-b-title (lv-label-create');
  });
});

describe('arcs and spinners', () => {
  it('use arc styles instead of a box border', () => {
    const arc = createComponent('arc', {
      name: 'dial',
      props: { arcWidth: 14, arcColor: '#ff0000', arcTrackColor: '#222222' },
      // legacy projects stored the arc in the border style: it must not become a box border
      styles: { default: { borderWidth: 15, borderColor: '#2196F3' } },
    });
    const ui = generateCode([createPage({ components: [arc] })])['ui/ui.lisp'];
    expect(ui).toContain('(lv-obj-set-style-border-width ui-dial 0 LV_PART_MAIN)');
    expect(ui).not.toContain('border-width ui-dial 15');
    expect(ui).toContain('(lv-obj-set-style-arc-width ui-dial 14 LV_PART_INDICATOR)');
    expect(ui).toContain('(lv-obj-set-style-arc-color ui-dial 0xFF0000 LV_PART_INDICATOR)');
    expect(ui).toContain('(lv-obj-set-style-arc-color ui-dial 0x222222 LV_PART_MAIN)');
  });
});

describe('ui/ui_events.lisp', () => {
  const ev = sampleProject()['ui/ui_events.lisp'];
  it('builds navigation, visibility and value actions', () => {
    expect(ev).toContain('(defun ui-event-start-btn-clicked (e)');
    expect(ev).toContain('(ui-load-screen-settings)');
    expect(ev).toContain('(lv-obj-remove-flag ui-status LV_OBJ_FLAG_HIDDEN)');
    expect(ev).toContain('(lv-slider-set-value ui-level 7 LV_ANIM_ON)');
  });
  it('inlines custom Lisp code', () => {
    expect(ev).toContain('(print "long")');
  });
});

describe('ui/ui_logic.lisp', () => {
  const logic = sampleProject()['ui/ui_logic.lisp'];
  it('declares variables and functions', () => {
    expect(logic).toContain('(def var-counter 2)');
    expect(logic).toContain('(defun logic-on-click ()');
    expect(logic).toContain('(defun logic-blink ()');
  });
  it('turns if/else into (if ...) with inlined expressions', () => {
    expect(logic).toContain('(if (> var-counter 3)');
    expect(logic).toContain('(setq var-counter 1)');
    expect(logic).toMatch(/\(if \(lv-obj-has-flag ui-status LV_OBJ_FLAG_HIDDEN\)/);
  });
  it('registers triggers and ticks timers', () => {
    expect(logic).toContain("(lv-obj-add-event-cb ui-start-btn 'logic-on-click-on-event LV_EVENT_CLICKED)");
    expect(logic).toContain('(def logic-blink-timer0 (systime))');
    expect(logic).toContain('(if (>= (secs-since logic-blink-timer0) 0.5)');
    expect(logic).toContain('(lv-label-set-text ui-status "tick")');
  });
  it('generates valid empty logic', () => {
    const empty = generateCode([])['ui/ui_logic.lisp'];
    expect(empty).toContain('(defun ui-logic-init ()');
    expect(empty).toContain('(defun ui-logic-tick ()');
  });
});
