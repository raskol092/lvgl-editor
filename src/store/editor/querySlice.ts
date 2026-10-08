import type { StateCreator } from 'zustand';
import { findComponentInTree, flattenComponents } from './tree';
import type { LvglComponent } from '../../types';
import type { EditorState } from './types';

export const createQuerySlice: StateCreator<EditorState, [], [], Pick<EditorState, 'getComponentById' | 'getComponentsByParent' | 'findComponentAtPoint' | 'getAllComponents' | 'getCurrentPage'>> = (_set, get) => ({
  getComponentById: (id) => {
    const { pages, currentPageId } = get();
    const currentPage = pages.find(p => p.id === currentPageId);
    if (!currentPage) return undefined;
    return findComponentInTree(currentPage.components, id);
  },
  getComponentsByParent: (parentId) => {
    const { pages, currentPageId } = get();
    const currentPage = pages.find(p => p.id === currentPageId);
    if (!currentPage) return [];
    
    if (parentId === null) {
      return currentPage.components;
    }
    const parent = findComponentInTree(currentPage.components, parentId);
    return parent?.children || [];
  },
  findComponentAtPoint: (x, y) => {
    const { pages, currentPageId } = get();
    const currentPage = pages.find(p => p.id === currentPageId);
    if (!currentPage) return undefined;
    
    // Recursive search, preferring deeper (child) components
    const findAtPoint = (comps: LvglComponent[], offsetX = 0, offsetY = 0): LvglComponent | undefined => {
      // Search in reverse order (top-most first)
      for (let i = comps.length - 1; i >= 0; i--) {
        const comp = comps[i];
        const compX = comp.x + offsetX;
        const compY = comp.y + offsetY;
        
        if (
          x >= compX &&
          x <= compX + comp.width &&
          y >= compY &&
          y <= compY + comp.height
        ) {
          // Check children first
          const childHit = findAtPoint(comp.children, compX, compY);
          if (childHit) return childHit;
          return comp;
        }
      }
      return undefined;
    };
    
    return findAtPoint(currentPage.components);
  },
  getAllComponents: () => {
    const { pages, currentPageId } = get();
    const currentPage = pages.find(p => p.id === currentPageId);
    if (!currentPage) return [];
    return flattenComponents(currentPage.components);
  },
  getCurrentPage: () => {
    const { pages, currentPageId } = get();
    return pages.find(p => p.id === currentPageId);
  },
});
