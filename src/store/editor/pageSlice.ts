import type { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Page } from '../../types';
import type { EditorState } from './types';

export const createPageSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'addPage' | 'deletePage' | 'renamePage' | 'setCurrentPage' | 'updatePageBackground'>> = (set, get) => ({
  addPage: () => {
    const id = uuidv4();
    const pageCount = get().pages.length;
    const newPage: Page = {
      id,
      name: `Page ${pageCount + 1}`,
      components: [],
      backgroundColor: '#F5F5F5',
    };
    
    set(state => ({
      pages: [...state.pages, newPage],
      currentPageId: id,
      selection: { ...state.selection, selectedIds: [] },
    }));
    
    return id;
  },
  deletePage: (pageId) => {
    const { pages, currentPageId } = get();
    if (pages.length <= 1) return; // Don't delete last page
    
    const newPages = pages.filter(p => p.id !== pageId);
    const newCurrentPageId = pageId === currentPageId 
      ? newPages[0].id 
      : currentPageId;
    
    set({
      pages: newPages,
      currentPageId: newCurrentPageId,
      selection: { selectedIds: [], hoveredId: null },
    });
  },
  renamePage: (pageId, name) => {
    set(state => ({
      pages: state.pages.map(p => 
        p.id === pageId ? { ...p, name } : p
      ),
    }));
  },
  setCurrentPage: (pageId) => {
    set({
      currentPageId: pageId,
      selection: { selectedIds: [], hoveredId: null },
    });
  },
  updatePageBackground: (pageId, color) => {
    set(state => ({
      pages: state.pages.map(p => 
        p.id === pageId ? { ...p, backgroundColor: color } : p
      ),
    }));
  },
});
