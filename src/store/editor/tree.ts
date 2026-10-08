import { cloneStyles } from '../../utils/styleKeys';
import type { LvglComponent, Page } from '../../types';

// Helper to find component in tree
export function findComponentInTree(components: LvglComponent[], id: string): LvglComponent | undefined {
  for (const comp of components) {
    if (comp.id === id) return comp;
    const found = findComponentInTree(comp.children, id);
    if (found) return found;
  }
  return undefined;
}

// Helper to flatten component tree
export function flattenComponents(components: LvglComponent[]): LvglComponent[] {
  const result: LvglComponent[] = [];
  for (const comp of components) {
    result.push(comp);
    result.push(...flattenComponents(comp.children));
  }
  return result;
}

// Helper to update component in tree (reference-stable: unchanged subtrees keep original references)
export function updateComponentInTree(
  components: LvglComponent[],
  id: string,
  updates: Partial<LvglComponent>
): LvglComponent[] {
  let changed = false;
  const result = components.map(comp => {
    if (comp.id === id) {
      changed = true;
      return { ...comp, ...updates };
    }
    if (comp.children.length > 0) {
      const newChildren = updateComponentInTree(comp.children, id, updates);
      if (newChildren !== comp.children) {
        changed = true;
        return { ...comp, children: newChildren };
      }
    }
    return comp;
  });
  return changed ? result : components;
}

// Helper to delete component from tree
export function deleteComponentFromTree(components: LvglComponent[], ids: string[]): LvglComponent[] {
  return components
    .filter(comp => !ids.includes(comp.id))
    .map(comp => ({
      ...comp,
      children: deleteComponentFromTree(comp.children, ids),
    }));
}

// Helper to add component to tree
export function addComponentToTree(
  components: LvglComponent[],
  newComponent: LvglComponent,
  parentId: string | null
): LvglComponent[] {
  if (parentId === null) {
    return [...components, newComponent];
  }
  
  return components.map(comp => {
    if (comp.id === parentId) {
      return {
        ...comp,
        children: [...comp.children, newComponent],
      };
    }
    if (comp.children.length > 0) {
      return {
        ...comp,
        children: addComponentToTree(comp.children, newComponent, parentId),
      };
    }
    return comp;
  });
}

// Helper to change z-order of component in array
export function changeZOrder(
  components: LvglComponent[],
  componentId: string,
  operation: 'front' | 'back' | 'forward' | 'backward'
): LvglComponent[] {
  // First check if component is at this level
  const index = components.findIndex(c => c.id === componentId);
  
  if (index !== -1) {
    const newComponents = [...components];
    const [component] = newComponents.splice(index, 1);
    
    switch (operation) {
      case 'front':
        // Move to end (top)
        newComponents.push(component);
        break;
      case 'back':
        // Move to beginning (bottom)
        newComponents.unshift(component);
        break;
      case 'forward':
        // Move up one position (higher index = more on top)
        if (index < components.length - 1) {
          newComponents.splice(index + 1, 0, component);
        } else {
          newComponents.push(component);
        }
        break;
      case 'backward':
        // Move down one position
        if (index > 0) {
          newComponents.splice(index - 1, 0, component);
        } else {
          newComponents.unshift(component);
        }
        break;
    }
    return newComponents;
  }
  
  // Not found at this level, search in children
  return components.map(comp => ({
    ...comp,
    children: changeZOrder(comp.children, componentId, operation),
  }));
}

// Helper to move component to new parent
export function moveComponentToParent(
  components: LvglComponent[],
  componentId: string,
  newParentId: string | null
): LvglComponent[] {
  // First, find and remove the component
  let movedComponent: LvglComponent | undefined;
  
  const removeFromTree = (comps: LvglComponent[]): LvglComponent[] => {
    return comps
      .filter(comp => {
        if (comp.id === componentId) {
          movedComponent = comp;
          return false;
        }
        return true;
      })
      .map(comp => ({
        ...comp,
        children: removeFromTree(comp.children),
      }));
  };
  
  const newComponents = removeFromTree(components);
  
  if (!movedComponent) return components;
  
  // Update parent reference
  movedComponent = { ...movedComponent, parentId: newParentId };
  
  // Add to new parent
  return addComponentToTree(newComponents, movedComponent, newParentId);
}

// Deep clone components for history
export function cloneComponents(components: LvglComponent[]): LvglComponent[] {
  return components.map(comp => ({
    ...comp,
    props: { ...comp.props },
    styles: cloneStyles(comp.styles),
    events: comp.events.map(e => ({ ...e, action: e.action ? { ...e.action } : undefined })),
    animations: (comp.animations || []).map(a => ({ ...a })),
    children: cloneComponents(comp.children),
  }));
}

// Deep clone pages for history
export function clonePages(pages: Page[]): Page[] {
  return pages.map(page => ({
    ...page,
    components: cloneComponents(page.components),
  }));
}
