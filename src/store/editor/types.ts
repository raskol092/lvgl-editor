import type {
  LvglComponent,
  CanvasState,
  SelectionState,
  DragState,
  HistoryEntry,
  AlignmentGuide,
  Page,
} from '../../types';

export interface EditorState {
  // Multi-page support
  pages: Page[];
  currentPageId: string;
  
  // Canvas state
  canvas: CanvasState;
  
  // Selection state
  selection: SelectionState;
  
  // Drag state
  drag: DragState;
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  
  // Alignment guides
  alignmentGuides: AlignmentGuide[];
  
  // Computed - current page components (for backward compatibility)
  components: LvglComponent[];
  
  // Actions - Pages
  addPage: () => string;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  setCurrentPage: (pageId: string) => void;
  updatePageBackground: (pageId: string, color: string) => void;
  
  // Actions - Components
  addComponent: (type: string, x: number, y: number, parentId?: string | null) => string;
  updateComponent: (id: string, updates: Partial<LvglComponent>) => void;
  deleteComponents: (ids: string[]) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  resizeComponent: (id: string, width: number, height: number, x?: number, y?: number) => void;
  reparentComponent: (id: string, newParentId: string | null) => void;
  clearComponents: () => void;
  setComponents: (components: LvglComponent[]) => void;
  setPages: (pages: Page[]) => void;
  
  // Actions - Z-order
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  
  // Actions - Selection
  selectComponent: (id: string, addToSelection?: boolean) => void;
  selectComponents: (ids: string[]) => void;
  clearSelection: () => void;
  setHoveredComponent: (id: string | null) => void;
  
  // Actions - Canvas
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  setSnapToGrid: (snap: boolean) => void;
  
  // Actions - Drag
  startDrag: (dragType: DragState['dragType'], data: Partial<DragState>) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  
  // Combined move/resize + drag update (single set call for performance)
  moveComponentAndUpdateDrag: (id: string, x: number, y: number, dragStartX: number, dragStartY: number) => void;
  resizeComponentAndUpdateDrag: (id: string, width: number, height: number, dragStartX: number, dragStartY: number, x?: number, y?: number) => void;
  
  // Actions - History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Actions - Alignment
  updateAlignmentGuides: (guides: AlignmentGuide[]) => void;
  clearAlignmentGuides: () => void;
  
  // Helpers
  getComponentById: (id: string) => LvglComponent | undefined;
  getComponentsByParent: (parentId: string | null) => LvglComponent[];
  findComponentAtPoint: (x: number, y: number) => LvglComponent | undefined;
  getAllComponents: () => LvglComponent[];
  getCurrentPage: () => Page | undefined;
}
