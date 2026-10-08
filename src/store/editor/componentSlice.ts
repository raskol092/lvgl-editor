import type { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { updateComponentInTree, deleteComponentFromTree, addComponentToTree, changeZOrder, moveComponentToParent, cloneComponents, clonePages } from './tree';
import { CONTENT_SIZED_TYPES } from './defaults';
import { useThemeStore, builtinThemes } from '../themeStore';
import { themeNewComponent } from '../../utils/themeApply';
import { getComponentDefinition } from '../../utils/componentDefinitions';
import type { LvglComponent } from '../../types';
import { isNameTaken } from '../../utils/uniqueName';
import type { EditorState } from './types';

export const createComponentSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addComponent' | 'updateComponent' | 'deleteComponents' | 'moveComponent' | 'resizeComponent' | 'reparentComponent' | 'setComponents' | 'setPages' | 'clearComponents' | 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward'>> = (set, get) => ({
  addComponent: (type, x, y, parentId = null) => {
    const definition = getComponentDefinition(type);
    if (!definition) return '';
    
    const id = uuidv4();
    const { canvas, currentPageId } = get();
    
    // Snap to grid if enabled
    let finalX = x;
    let finalY = y;
    if (canvas.snapToGrid) {
      finalX = Math.round(x / canvas.gridSize) * canvas.gridSize;
      finalY = Math.round(y / canvas.gridSize) * canvas.gridSize;
    }
    
    const newComponent: LvglComponent = {
      id,
      type,
      name: `${definition.name}_${id.slice(0, 4)}`,
      x: finalX,
      y: finalY,
      width: definition.defaultWidth,
      height: definition.defaultHeight,
      children: [],
      props: { ...definition.defaultProps },
      styles: {
        default: { ...definition.defaultStyles.default },
      },
      // text widgets size themselves to their text (LV_SIZE_CONTENT), like in LVGL
      ...(CONTENT_SIZED_TYPES.has(type) ? { widthMode: 'content' as const, heightMode: 'content' as const } : {}),
      events: [],
      animations: [],
      parentId,
      locked: false,
      visible: true,
    };
    
    // new components start in the light look; follow the active theme
    const activeTheme = useThemeStore.getState().currentTheme;
    const toAdd = activeTheme.id === 'light'
      ? newComponent
      : themeNewComponent(newComponent, builtinThemes[0].colors, activeTheme.colors);

    get().saveToHistory();
    
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: addComponentToTree(page.components, toAdd, parentId),
          };
        }
        return page;
      }),
    }));
    
    // Auto-update tabChildMap / tileChildMap when adding to tabview / tileview
    if (parentId) {
      const parent = get().getComponentById(parentId);
      if (parent?.type === 'tabview') {
        const tabChildMap: Record<string, string[]> = { ...(parent.props?.tabChildMap || {}) };
        const activeTab = String(parent.props?.activeTab || 0);
        if (!tabChildMap[activeTab]) tabChildMap[activeTab] = [];
        tabChildMap[activeTab] = [...tabChildMap[activeTab], id];
        get().updateComponent(parentId, { props: { ...parent.props, tabChildMap } });
      } else if (parent?.type === 'tileview') {
        const tileChildMap: Record<string, string[]> = { ...(parent.props?.tileChildMap || {}) };
        const key = `${parent.props?.currentRow || 0}-${parent.props?.currentCol || 0}`;
        if (!tileChildMap[key]) tileChildMap[key] = [];
        tileChildMap[key] = [...tileChildMap[key], id];
        get().updateComponent(parentId, { props: { ...parent.props, tileChildMap } });
      }
    }
    
    return id;
  },
  updateComponent: (id, updates) => {
    const { currentPageId } = get();
    // names must stay unique on a screen: logic and events refer to components by name
    if (updates.name !== undefined) {
      const page = get().pages.find(p => p.id === currentPageId);
      const name = updates.name.trim();
      if (!name || (page && isNameTaken(page.components, name, id))) {
        const { name: _dropped, ...rest } = updates;
        void _dropped;
        if (Object.keys(rest).length === 0) return;
        updates = rest;
      } else {
        updates = { ...updates, name };
      }
    }
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: updateComponentInTree(page.components, id, updates),
          };
        }
        return page;
      }),
    }));
  },
  deleteComponents: (ids) => {
    if (ids.length === 0) return;
    const { currentPageId } = get();
    
    // Remove from parent's childMap before deleting
    for (const id of ids) {
      const comp = get().getComponentById(id);
      if (comp?.parentId) {
        const parent = get().getComponentById(comp.parentId);
        if (parent?.type === 'tabview') {
          const tabChildMap: Record<string, string[]> = { ...(parent.props?.tabChildMap || {}) };
          for (const key of Object.keys(tabChildMap)) {
            tabChildMap[key] = tabChildMap[key].filter((cid: string) => cid !== id);
          }
          get().updateComponent(comp.parentId, { props: { ...parent.props, tabChildMap } });
        } else if (parent?.type === 'tileview') {
          const tileChildMap: Record<string, string[]> = { ...(parent.props?.tileChildMap || {}) };
          for (const key of Object.keys(tileChildMap)) {
            tileChildMap[key] = tileChildMap[key].filter((cid: string) => cid !== id);
          }
          get().updateComponent(comp.parentId, { props: { ...parent.props, tileChildMap } });
        }
      }
    }
    
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: deleteComponentFromTree(page.components, ids),
          };
        }
        return page;
      }),
      selection: {
        ...state.selection,
        selectedIds: state.selection.selectedIds.filter(id => !ids.includes(id)),
      },
    }));
  },
  moveComponent: (id, x, y) => {
    const { canvas, currentPageId } = get();
    let finalX = x;
    let finalY = y;
    
    if (canvas.snapToGrid) {
      finalX = Math.round(x / canvas.gridSize) * canvas.gridSize;
      finalY = Math.round(y / canvas.gridSize) * canvas.gridSize;
    }
    
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: updateComponentInTree(page.components, id, { x: finalX, y: finalY }),
          };
        }
        return page;
      }),
    }));
  },
  resizeComponent: (id, width, height, x, y) => {
    const { canvas, currentPageId } = get();
    let finalWidth = Math.max(10, width);
    let finalHeight = Math.max(10, height);
    
    if (canvas.snapToGrid) {
      finalWidth = Math.round(width / canvas.gridSize) * canvas.gridSize;
      finalHeight = Math.round(height / canvas.gridSize) * canvas.gridSize;
      finalWidth = Math.max(canvas.gridSize, finalWidth);
      finalHeight = Math.max(canvas.gridSize, finalHeight);
    }
    
    const updates: Partial<LvglComponent> = { width: finalWidth, height: finalHeight };
    if (x !== undefined) {
      updates.x = canvas.snapToGrid ? Math.round(x / canvas.gridSize) * canvas.gridSize : x;
    }
    if (y !== undefined) {
      updates.y = canvas.snapToGrid ? Math.round(y / canvas.gridSize) * canvas.gridSize : y;
    }
    
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: updateComponentInTree(page.components, id, updates),
          };
        }
        return page;
      }),
    }));
  },
  reparentComponent: (id, newParentId) => {
    const { currentPageId } = get();
    
    // Remove from old parent's childMap before reparenting
    const comp = get().getComponentById(id);
    if (comp?.parentId) {
      const oldParent = get().getComponentById(comp.parentId);
      if (oldParent?.type === 'tabview') {
        const tabChildMap: Record<string, string[]> = { ...(oldParent.props?.tabChildMap || {}) };
        for (const key of Object.keys(tabChildMap)) {
          tabChildMap[key] = tabChildMap[key].filter((cid: string) => cid !== id);
        }
        get().updateComponent(comp.parentId, { props: { ...oldParent.props, tabChildMap } });
      } else if (oldParent?.type === 'tileview') {
        const tileChildMap: Record<string, string[]> = { ...(oldParent.props?.tileChildMap || {}) };
        for (const key of Object.keys(tileChildMap)) {
          tileChildMap[key] = tileChildMap[key].filter((cid: string) => cid !== id);
        }
        get().updateComponent(comp.parentId, { props: { ...oldParent.props, tileChildMap } });
      }
    }
    
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: moveComponentToParent(page.components, id, newParentId),
          };
        }
        return page;
      }),
    }));
    
    // Add to new parent's childMap after reparenting
    if (newParentId) {
      const newParent = get().getComponentById(newParentId);
      if (newParent?.type === 'tabview') {
        const tabChildMap: Record<string, string[]> = { ...(newParent.props?.tabChildMap || {}) };
        const activeTab = String(newParent.props?.activeTab || 0);
        if (!tabChildMap[activeTab]) tabChildMap[activeTab] = [];
        tabChildMap[activeTab] = [...tabChildMap[activeTab], id];
        get().updateComponent(newParentId, { props: { ...newParent.props, tabChildMap } });
      } else if (newParent?.type === 'tileview') {
        const tileChildMap: Record<string, string[]> = { ...(newParent.props?.tileChildMap || {}) };
        const key = `${newParent.props?.currentRow || 0}-${newParent.props?.currentCol || 0}`;
        if (!tileChildMap[key]) tileChildMap[key] = [];
        tileChildMap[key] = [...tileChildMap[key], id];
        get().updateComponent(newParentId, { props: { ...newParent.props, tileChildMap } });
      }
    }
  },
  setComponents: (components) => {
    const { currentPageId } = get();
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: cloneComponents(components),
          };
        }
        return page;
      }),
      selection: { selectedIds: [], hoveredId: null },
    }));
  },
  setPages: (pages) => {
    get().saveToHistory();
    set({
      pages: clonePages(pages),
      currentPageId: pages.length > 0 ? pages[0].id : get().currentPageId,
      selection: { selectedIds: [], hoveredId: null },
    });
  },
  clearComponents: () => {
    const { currentPageId } = get();
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: [],
          };
        }
        return page;
      }),
      selection: { selectedIds: [], hoveredId: null },
    }));
  },
  bringToFront: (id) => {
    const { currentPageId } = get();
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: changeZOrder(page.components, id, 'front'),
          };
        }
        return page;
      }),
    }));
  },
  sendToBack: (id) => {
    const { currentPageId } = get();
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: changeZOrder(page.components, id, 'back'),
          };
        }
        return page;
      }),
    }));
  },
  bringForward: (id) => {
    const { currentPageId } = get();
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: changeZOrder(page.components, id, 'forward'),
          };
        }
        return page;
      }),
    }));
  },
  sendBackward: (id) => {
    const { currentPageId } = get();
    get().saveToHistory();
    set(state => ({
      pages: state.pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            components: changeZOrder(page.components, id, 'backward'),
          };
        }
        return page;
      }),
    }));
  },
});
