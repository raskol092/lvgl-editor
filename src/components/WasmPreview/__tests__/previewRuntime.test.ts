import { describe, it, expect } from 'vitest';
import { createPreviewRuntime } from '../previewRuntime';
import { createPage, createComponent, createEvent, createBuiltinAction, createLogicNode, createLogicPort, createLogicGraph, createLogicConnection } from '../../../codegen/__tests__/helpers';

function setup(graphs: unknown[] = []) {
  const calls: unknown[][] = [];
  const nav: string[] = [];
  const btn = createComponent('btn', {
    id: 'b1', name: 'go',
    events: [
      createEvent({ id: 'e1', action: createBuiltinAction({ type: 'navigate', targetPage: 'two' }) }),
      createEvent({ id: 'e2', action: createBuiltinAction({ type: 'setState', targetComponent: 'lbl', property: 'checked', value: 'toggle' }) }),
      createEvent({ id: 'e3', action: createBuiltinAction({ type: 'setText', targetComponent: 'lbl', value: 'hi' }) }),
    ],
  } as never);
  const lbl = createComponent('label', { id: 'l1', name: 'lbl' } as never);
  const page = createPage({ id: 'p1', name: 'one', components: [btn, lbl] } as never);
  const rt = createPreviewRuntime({
    getWasm: () => ({ ccall: (n: string, _r: unknown, _t: unknown, a: unknown[]) => { calls.push([n, ...a]); return 0; } }),
    getPage: () => page,
    getGraphs: () => graphs as never,
    navigate: (n) => nav.push(n),
  });
  return { rt, calls, nav };
}

describe('preview runtime', () => {
  it('runs built-in actions on events', () => {
    const { rt, calls, nav } = setup();
    rt.handleEvent('b1', 'LV_EVENT_CLICKED');
    expect(nav).toEqual(['two']);
    expect(calls).toContainEqual(['pv_set_state', 'l1', 'checked', 2]);
    expect(calls).toContainEqual(['pv_set_text', 'l1', 'hi']);
    rt.handleEvent('b1', 'LV_EVENT_PRESSED');
    expect(nav.length).toBe(1);
  });

  it('runs an event-trigger logic graph with variables and expressions', () => {
    const port = (id: string, name: string, type: string, def?: unknown) => createLogicPort({ id, name, type, defaultValue: def } as never);
    const trig = createLogicNode('event_trigger', { id: 't', params: { targetComponent: 'go', eventType: 'LV_EVENT_CLICKED' }, outputs: [port('to', 'Exec', 'execution')] })
    const num = createLogicNode('map_range', { id: 'm', inputs: [port('a', 'Value', 'float', 5), port('b', 'In min', 'float', 0), port('c', 'In max', 'float', 10), port('d', 'Out min', 'float', 0), port('e', 'Out max', 'float', 100)], outputs: [port('mo', 'Result', 'float')] })
    const str = createLogicNode('to_string', { id: 's', params: { format: '%d' }, inputs: [port('sv', 'Value', 'float')], outputs: [port('so', 'Result', 'string')] })
    const setT = createLogicNode('set_text', { id: 'x', params: { targetComponent: 'lbl' }, inputs: [port('xi', 'Exec', 'execution'), port('xt', 'Text', 'string')], outputs: [port('xo', 'Done', 'execution')] })
    const conn = (a: string, ao: string, b: string, bi: string, type = 'data') => createLogicConnection({ sourceNode: a, sourceOutput: ao, targetNode: b, targetInput: bi, type } as never)
    const g = createLogicGraph({ id: 'g', name: 'g', nodes: [trig, num, str, setT], connections: [conn('t', 'to', 'x', 'xi', 'execution'), conn('m', 'mo', 's', 'sv'), conn('s', 'so', 'x', 'xt')] })
    const { rt, calls } = setup([g]);
    rt.handleEvent('b1', 'LV_EVENT_CLICKED');
    expect(calls).toContainEqual(['pv_set_text', 'l1', '50']);
  });
});
