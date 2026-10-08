// Component names are what logic, events, bindings and the generated Lisp refer to, so they must be unique on a screen.
import type { LvglComponent } from '../types';

export function collectNames(components: LvglComponent[], excludeId?: string, into = new Set<string>()): Set<string> {
  for (const c of components) {
    if (c.id !== excludeId) into.add(c.name);
    collectNames(c.children, excludeId, into);
  }
  return into;
}

/** True when another component of the same screen already has this name. */
export function isNameTaken(pageComponents: LvglComponent[], name: string, excludeId?: string): boolean {
  return collectNames(pageComponents, excludeId).has(name);
}

/** `name`, or `name_2`, `name_3`, ... when it is taken (also by names in `extra`). */
export function makeUniqueName(taken: Set<string>, name: string): string {
  if (!taken.has(name)) return name;
  const base = name.replace(/_\d+$/, '');
  for (let i = 2; ; i++) {
    const candidate = `${base}_${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Names of a duplicated component and its children, unique against `taken` (which is extended). */
export function renameUniquely(comp: LvglComponent, taken: Set<string>): LvglComponent {
  const name = makeUniqueName(taken, comp.name);
  taken.add(name);
  return { ...comp, name, children: comp.children.map(c => renameUniquely(c, taken)) };
}
