import { it, expect } from 'vitest'
import { generateCode } from '../index'
import { createComponent, createPage, createLogicNode, createLogicPort, createLogicGraph, createLogicConnection, createLogicVariable } from '../../__tests__/helpers'

const ex = (id: string, name = 'Exec') => createLogicPort({ id, name, type: 'execution' })
const val = (id: string, name: string, type = 'any', d?: unknown) => createLogicPort({ id, name, type, defaultValue: d } as never)
const conn = (a: string, ao: string, b: string, bi: string, type?: string) => createLogicConnection({ sourceNode: a, sourceOutput: ao, targetNode: b, targetInput: bi, ...(type ? { type } : {}) } as never)

it('every logic node type generates the expected Lisp', () => {
  const pages = [createPage({ id: 'p1', name: 'main', components: [createComponent('slider', { id: 's1', name: 'lvl' }), createComponent('label', { id: 'l1', name: 'txt' }), createComponent('bar', { id: 'b1', name: 'prog' })] }), createPage({ id: 'p2', name: 'second', components: [] })]
  const nodes = [
    createLogicNode('timer_trigger', { id: 'tm', params: { mode: 'repeat', duration: 500 }, outputs: [ex('tmo')] }),
    createLogicNode('switch', { id: 'sw', params: { cases: [0, 1] }, inputs: [ex('swi'), val('swv', 'Value', 'int', 1)], outputs: [ex('swc0', 'Case 0'), ex('swc1', 'Case 1'), ex('swd', 'Default')] }),
    createLogicNode('set_value', { id: 'sv', params: { targetComponent: 'b1', componentType: 'bar' }, inputs: [ex('svi'), val('svn', 'Number', 'int', 50)], outputs: [ex('svo', 'Done')] }),
    createLogicNode('navigate_page', { id: 'nv', params: { targetPage: 'second', animation: 'fade' }, inputs: [ex('nvi')], outputs: [ex('nvo', 'Done')] }),
    createLogicNode('delay', { id: 'dl', params: { duration: 250 }, inputs: [ex('dli')], outputs: [ex('dlo', 'Done')] }),
    createLogicNode('call_function', { id: 'cf', params: { functionName: 'my-fn', arguments: [1, 2] }, inputs: [ex('cfi')], outputs: [ex('cfo', 'Done')] }),
    createLogicNode('math_op', { id: 'mt', params: { operator: '+' }, inputs: [val('mta', 'A', 'int', 1), val('mtb', 'B', 'int', 2)], outputs: [val('mto', 'Result', 'int')] }),
    createLogicNode('string_op', { id: 'st', params: { operation: 'concat' }, inputs: [val('sta', 'A', 'string', 'a'), val('stb', 'B', 'string', 'b')], outputs: [val('sto', 'Result', 'string')] }),
    createLogicNode('logic_op', { id: 'lo', params: { operator: 'OR' }, inputs: [val('loa', 'A', 'bool', true), val('lob', 'B', 'bool', false)], outputs: [val('loo', 'Result', 'bool')] }),
    createLogicNode('set_text', { id: 'tx', params: { targetComponent: 'l1' }, inputs: [ex('txi'), val('txt', 'Text', 'string')], outputs: [ex('txo', 'Done')] }),
    createLogicNode('c_code_block', { id: 'cc', params: { code: '(print "hi")' }, inputs: [ex('cci')], outputs: [ex('cco', 'Done')] }),
  ]
  const g = createLogicGraph({ id: 'g', name: 'all', nodes, variables: [createLogicVariable({ name: 'n', type: 'int', defaultValue: 0 })], connections: [
    conn('tm', 'tmo', 'sw', 'swi'),
    conn('sw', 'swc0', 'sv', 'svi'),
    conn('sw', 'swc1', 'nv', 'nvi'),
    conn('sv', 'svo', 'dl', 'dli'),
    conn('dl', 'dlo', 'cf', 'cfi'),
    conn('cf', 'cfo', 'tx', 'txi'),
    conn('mt', 'mto', 'sv', 'svn', 'data'),
    conn('st', 'sto', 'tx', 'txt', 'data'),
    conn('tx', 'txo', 'cc', 'cci'),
  ] })
  const out = generateCode(pages, undefined, [g], undefined, [], [], '', 14)
  const src = out['ui/ui_logic.lisp']
  // timer trigger -> periodic call from the main loop
  expect(src).toContain('(secs-since logic-all-timer0) 0.5')
  // switch -> cond over the wired value with the case bodies
  expect(src).toContain('((= 1 0)')
  expect(src).toContain('((= 1 1)')
  // set_value (bar) takes the wired math result
  expect(src).toContain('(lv-bar-set-value ui-prog (+ 1 2) LV_ANIM_ON)')
  // navigate, delay, call_function, set_text with string_op, custom code
  expect(src).toContain('(lv-screen-load-anim ui-screen-second LV_SCREEN_LOAD_ANIM_FADE_IN 300 0 nil)')
  expect(src).toContain('(sleep 0.25)')
  expect(src).toContain('(my-fn 1 2)')
  expect(src).toContain('(lv-label-set-text ui-txt (str-merge "a" "b"))')
  expect(src).toContain('(print "hi")')
  // parentheses balance
  let d = 0, str = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (str) { if (c === '\\') i++; else if (c === '"') str = false; continue }
    if (c === '"') str = true
    else if (c === ';') while (i < src.length && src[i] !== '\n') i++
    else if (c === '(') d++
    else if (c === ')') d--
  }
  expect(d).toBe(0)
})
