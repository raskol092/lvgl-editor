import type { StateCreator } from 'zustand';
import { clonePages } from './tree';
import { MAX_HISTORY } from './defaults';
import type { EditorState } from './types';

export const createHistorySlice: StateCreator<EditorState, [], [], Pick<EditorState, 'undo' | 'redo' | 'saveToHistory'>> = (set, get) => ({
  undo: () => {
    const { history, historyIndex, pages } = get();
    if (historyIndex < 0) return;

    const entry = history[historyIndex];

    // Save current state as a redo point (one past historyIndex)
    const newHistory = [...history];
    // If there's no entry after historyIndex, push current state for redo
    if (historyIndex === history.length - 1) {
      newHistory.push({
        pages: clonePages(pages),
        timestamp: Date.now(),
      });
    } else {
      // Replace the entry right after historyIndex with current state
      newHistory[historyIndex + 1] = {
        pages: clonePages(pages),
        timestamp: Date.now(),
      };
    }

    set({
      pages: clonePages(entry.pages || []),
      history: newHistory,
      historyIndex: historyIndex - 1,
    });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex + 1 >= history.length) return;

    // The entry at historyIndex + 1 is the state to restore
    // (either a previously saved state or the state saved during undo)
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];

    set({
      pages: clonePages(entry.pages || []),
      historyIndex: nextIndex,
    });
  },
  saveToHistory: () => {
    const { pages, history, historyIndex } = get();

    // Remove any future history (redo states) beyond current position
    const newHistory = history.slice(0, historyIndex + 1);

    // Add current state as a snapshot we can undo to
    newHistory.push({
      pages: clonePages(pages),
      timestamp: Date.now(),
    });

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
});
