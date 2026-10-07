import { describe, it, expect } from 'vitest';
import { useLogicEditorStore } from '../../components/LogicEditor/logicEditorStore';
import { displayName, displayGraphName } from '../legacy';
import { getNodeDefinition } from '../../components/LogicEditor/nodeDefinitions';
import { createLogicGraph, createLogicNode, createLogicPort } from '../../codegen/__tests__/helpers';

// Chinese strings of projects saved by the original version, as escapes
const IF_ELSE_LABEL = '\u6761\u4ef6\u5206\u652f';
const EXEC = '\u6267\u884c';
const COND = '\u6761\u4ef6';
const TRUE = '\u771f';
const FALSE = '\u5047';

describe('legacy (Chinese) data', () => {
  it('shows default names in the current language', () => {
    expect(displayName('\u672a\u547d\u540d\u9879\u76ee')).toBe('Untitled project');
    expect(displayName('My project')).toBe('My project');
    expect(displayGraphName('\u65b0\u903b\u8f91\u56fe')).toBe('New logic graph');
    expect(displayGraphName('\u65b0\u903b\u8f91\u56fe (\u5bfc\u5165)')).toBe('New logic graph (imported)');
  });

  it('replaces Chinese port names and labels of saved nodes by the node definition', () => {
    const def = getNodeDefinition('if_else')!;
    const node = createLogicNode('if_else', {
      id: 'n1',
      label: IF_ELSE_LABEL,
      inputs: [createLogicPort({ id: 'i1', name: EXEC }), createLogicPort({ id: 'i2', name: COND, type: 'bool' })],
      outputs: [createLogicPort({ id: 'o1', name: TRUE }), createLogicPort({ id: 'o2', name: FALSE })],
    });
    useLogicEditorStore.getState().setGraphs([createLogicGraph({ nodes: [node] })]);
    const saved = useLogicEditorStore.getState().graphs[0].nodes[0];
    expect(saved.label).toBe(def.label);
    expect(saved.inputs.map(p => p.name)).toEqual(def.inputs.map(p => p.name));
    expect(saved.outputs.map(p => p.name)).toEqual(def.outputs.map(p => p.name));
    // ids (and so the connections) are untouched
    expect(saved.inputs.map(p => p.id)).toEqual(['i1', 'i2']);
  });
});
