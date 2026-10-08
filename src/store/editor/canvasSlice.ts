import type { StateCreator } from 'zustand';
import type { EditorState } from './types';

export const createCanvasSlice: StateCreator<EditorState, [], [], Pick<EditorState, 'setCanvasSize' | 'setZoom' | 'setPan' | 'toggleGrid' | 'setSnapToGrid'>> = (set) => ({
  setCanvasSize: (width, height) => {
    set(state => ({
      canvas: { ...state.canvas, width, height },
    }));
  },
  setZoom: (zoom) => {
    const clampedZoom = Math.max(0.1, Math.min(3, zoom));
    set(state => ({
      canvas: { ...state.canvas, zoom: clampedZoom },
    }));
  },
  setPan: (x, y) => {
    set(state => ({
      canvas: { ...state.canvas, panX: x, panY: y },
    }));
  },
  toggleGrid: () => {
    set(state => ({
      canvas: { ...state.canvas, showGrid: !state.canvas.showGrid },
    }));
  },
  setSnapToGrid: (snap) => {
    set(state => ({
      canvas: { ...state.canvas, snapToGrid: snap },
    }));
  },
});
