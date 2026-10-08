import type { StateCreator } from 'zustand';
import { updateComponentInTree } from './tree';
import type { LvglComponent } from '../../types';
import type { EditorState } from './types';

export const createDragSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'startDrag' | 'updateDrag' | 'endDrag' | 'moveComponentAndUpdateDrag' | 'resizeComponentAndUpdateDrag'>> = (set, get) => ({
  startDrag: (dragType, data) => {
    set(state => ({
      drag: {
        ...state.drag,
        isDragging: true,
        dragType,
        ...data,
      },
    }));
  },
  updateDrag: (x, y) => {
    set(state => ({
      drag: {
        ...state.drag,
        currentX: x,
        currentY: y,
      },
    }));
  },
  endDrag: () => {
    set(() => ({
      drag: {
        isDragging: false,
        dragType: null,
        draggedComponentType: null,
        draggedComponentId: null,
        resizeHandle: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      },
    }));
  },
  moveComponentAndUpdateDrag: (id, x, y, dragStartX, dragStartY) => {
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
          const newComponents = updateComponentInTree(page.components, id, { x: finalX, y: finalY });
          if (newComponents === page.components) return page;
          return { ...page, components: newComponents };
        }
        return page;
      }),
      drag: {
        ...state.drag,
        startX: dragStartX,
        startY: dragStartY,
      },
    }));
  },
  resizeComponentAndUpdateDrag: (id, width, height, dragStartX, dragStartY, x, y) => {
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
          const newComponents = updateComponentInTree(page.components, id, updates);
          if (newComponents === page.components) return page;
          return { ...page, components: newComponents };
        }
        return page;
      }),
      drag: {
        ...state.drag,
        startX: dragStartX,
        startY: dragStartY,
      },
    }));
  },
});
