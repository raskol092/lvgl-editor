import React from 'react';

export interface BoxSelection {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/** Rubber-band rectangle while dragging on empty canvas. */
export const BoxSelectionRect: React.FC<{ box: BoxSelection }> = ({ box }) => {
  if (!box.isSelecting) return null;
  return (
    <div
      className="box-selection"
      style={{
        left: Math.min(box.startX, box.currentX),
        top: Math.min(box.startY, box.currentY),
        width: Math.abs(box.currentX - box.startX),
        height: Math.abs(box.currentY - box.startY),
      }}
    />
  );
};
