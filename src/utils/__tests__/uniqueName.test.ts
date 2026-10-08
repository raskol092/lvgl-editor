import { describe, it, expect } from 'vitest';
import { collectNames, isNameTaken, makeUniqueName, renameUniquely } from '../uniqueName';
import { createComponent } from '../../codegen/__tests__/helpers';

describe('uniqueName', () => {
  const kid = createComponent('label', { id: 'k', name: 'title' } as never);
  const box = createComponent('obj', { id: 'o', name: 'box', children: [kid] } as never);
  const btn = createComponent('btn', { id: 'b', name: 'go' } as never);
  const all = [box, btn];

  it('finds names in the whole tree and ignores the component itself', () => {
    expect([...collectNames(all)].sort()).toEqual(['box', 'go', 'title']);
    expect(isNameTaken(all, 'title')).toBe(true);
    expect(isNameTaken(all, 'go', 'b')).toBe(false);
    expect(isNameTaken(all, 'new')).toBe(false);
  });

  it('numbers duplicates', () => {
    expect(makeUniqueName(new Set(['go']), 'go')).toBe('go_2');
    expect(makeUniqueName(new Set(['go', 'go_2']), 'go')).toBe('go_3');
    expect(makeUniqueName(new Set(['go_2']), 'go_2')).toBe('go_3');
    expect(makeUniqueName(new Set(), 'go')).toBe('go');
  });

  it('renames a pasted tree uniquely', () => {
    const taken = collectNames(all);
    const copy = renameUniquely(box, taken);
    expect(copy.name).toBe('box_2');
    expect(copy.children[0].name).toBe('title_2');
    expect(renameUniquely(box, taken).name).toBe('box_3');
  });
});
