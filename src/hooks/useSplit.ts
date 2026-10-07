import { useCallback, useState } from 'react';
import type React from 'react';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function read(key: string, fallback: number): number {
  try {
    const v = Number(localStorage.getItem(`lvgl-editor-split-${key}`));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Size of a resizable panel, changed by dragging a splitter and remembered between sessions.
 * `dir` is 1 when dragging towards +x/+y makes the panel bigger, -1 for the opposite.
 */
export function useSplit(key: string, initial: number, min: number, max: number, axis: 'x' | 'y', dir: 1 | -1) {
  const [size, setSize] = useState(() => clamp(read(key, initial), min, max));

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const start = axis === 'x' ? e.clientX : e.clientY;
    const startSize = size;
    let last = startSize;
    document.body.classList.add('is-resizing', axis === 'x' ? 'is-resizing-x' : 'is-resizing-y');

    const move = (ev: PointerEvent) => {
      const delta = ((axis === 'x' ? ev.clientX : ev.clientY) - start) * dir;
      last = clamp(startSize + delta, min, max);
      setSize(last);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('is-resizing', 'is-resizing-x', 'is-resizing-y');
      try { localStorage.setItem(`lvgl-editor-split-${key}`, String(Math.round(last))); } catch { /* ignore */ }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [size, axis, dir, min, max, key]);

  const reset = useCallback(() => {
    setSize(initial);
    try { localStorage.removeItem(`lvgl-editor-split-${key}`); } catch { /* ignore */ }
  }, [initial, key]);

  return { size, onPointerDown, reset };
}
