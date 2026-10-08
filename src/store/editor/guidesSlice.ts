import type { StateCreator } from 'zustand';
import type { EditorState } from './types';

export const createGuidesSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'updateAlignmentGuides' | 'clearAlignmentGuides'>> = (set) => ({
  updateAlignmentGuides: (guides) => {
    set({ alignmentGuides: guides });
  },
  clearAlignmentGuides: () => {
    set({ alignmentGuides: [] });
  },
});
