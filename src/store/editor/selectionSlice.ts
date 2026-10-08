import type { StateCreator } from 'zustand';
import type { EditorState } from './types';

export const createSelectionSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'selectComponent' | 'selectComponents' | 'clearSelection' | 'setHoveredComponent'>> = (set) => ({
  selectComponent: (id, addToSelection = false) => {
    set(state => {
      if (addToSelection) {
        const isSelected = state.selection.selectedIds.includes(id);
        return {
          selection: {
            ...state.selection,
            selectedIds: isSelected
              ? state.selection.selectedIds.filter(sid => sid !== id)
              : [...state.selection.selectedIds, id],
          },
        };
      }
      return {
        selection: {
          ...state.selection,
          selectedIds: [id],
        },
      };
    });
  },
  selectComponents: (ids) => {
    set(state => ({
      selection: {
        ...state.selection,
        selectedIds: ids,
      },
    }));
  },
  clearSelection: () => {
    set(state => ({
      selection: {
        ...state.selection,
        selectedIds: [],
      },
    }));
  },
  setHoveredComponent: (id) => {
    set(state => ({
      selection: {
        ...state.selection,
        hoveredId: id,
      },
    }));
  },
});
