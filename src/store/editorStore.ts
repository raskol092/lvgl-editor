import { create } from 'zustand';
import { createDefaultPage } from './editor/defaults';
import type { EditorState } from './editor/types';
import { createPageSlice } from './editor/pageSlice';
import { createComponentSlice } from './editor/componentSlice';
import { createSelectionSlice } from './editor/selectionSlice';
import { createCanvasSlice } from './editor/canvasSlice';
import { createDragSlice } from './editor/dragSlice';
import { createHistorySlice } from './editor/historySlice';
import { createGuidesSlice } from './editor/guidesSlice';
import { createQuerySlice } from './editor/querySlice';

export type { EditorState } from './editor/types';

// Initial page
const initialPage = createDefaultPage();

export const useEditorStore = create<EditorState>()((set, get, api) => ({
  pages: [initialPage],
  currentPageId: initialPage.id,
  
  // Computed components (current page)
  get components() {
    const state = get();
    const currentPage = state.pages.find(p => p.id === state.currentPageId);
    return currentPage?.components || [];
  },
  canvas: {
    width: 480,
    height: 320,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    gridSize: 10,
    snapToGrid: true,
  },
  selection: {
    selectedIds: [],
    hoveredId: null,
  },
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
  history: [],
  historyIndex: -1,
  alignmentGuides: [],

  ...createPageSlice(set, get, api),
  ...createComponentSlice(set, get, api),
  ...createSelectionSlice(set, get, api),
  ...createCanvasSlice(set, get, api),
  ...createDragSlice(set, get, api),
  ...createHistorySlice(set, get, api),
  ...createGuidesSlice(set, get, api),
  ...createQuerySlice(set, get, api),
}));
