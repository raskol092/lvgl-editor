import React from 'react';
import type { CanvasState } from '../../types';

/** Dotted grid behind the components. */
export const CanvasGrid: React.FC<{ canvas: CanvasState }> = ({ canvas }) => {
  if (!canvas.showGrid) return null;

  // a project file can carry any value here: only a plain positive number reaches the SVG
  const gridSize = Math.max(2, Math.min(200, Number(canvas.gridSize) || 10));

  return (
    <svg
      className="canvas-grid"
      width={canvas.width}
      height={canvas.height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <defs>
        <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#e0e0e0" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
};
