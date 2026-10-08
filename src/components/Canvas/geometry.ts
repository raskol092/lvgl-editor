import type { LvglComponent } from '../../types';

// Flatten components for box selection
export function flattenComponents(comps: LvglComponent[], offsetX = 0, offsetY = 0): Array<{ comp: LvglComponent; absX: number; absY: number }> {
  const result: Array<{ comp: LvglComponent; absX: number; absY: number }> = [];
  for (const comp of comps) {
    const absX = comp.x + offsetX;
    const absY = comp.y + offsetY;
    result.push({ comp, absX, absY });
    result.push(...flattenComponents(comp.children, absX, absY));
  }
  return result;
}

// Find component in tree by id
export function findComponentInTree(components: LvglComponent[], id: string): LvglComponent | undefined {
  for (const comp of components) {
    if (comp.id === id) return comp;
    const found = findComponentInTree(comp.children, id);
    if (found) return found;
  }
  return undefined;
}

// Calculate absolute position of a component
export function getAbsolutePosition(comp: LvglComponent, allComps: LvglComponent[]): { x: number; y: number } {
  let absX = comp.x;
  let absY = comp.y;
  let pid = comp.parentId;
  while (pid) {
    const parent = findComponentInTree(allComps, pid);
    if (!parent) break;
    absX += parent.x;
    absY += parent.y;
    pid = parent.parentId;
  }
  return { x: absX, y: absY };
}

/** Visual (non-text) components that scale proportionally when dragged by a corner */
export const PROPORTIONAL_TYPES = new Set(['img', 'arc', 'spinner', 'switch', 'bar', 'slider', 'chart', 'calendar']);
