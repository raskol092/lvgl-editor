// Wrapper that lets a resource tile be dragged from the resource manager onto the canvas

import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export type ResourceDragData =
  | { type: 'new-icon'; iconName: string; path: string }
  | { type: 'new-image'; imageId: string; width: number; height: number };

interface Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'> {
  dragId: string;
  dragData: ResourceDragData;
}

const DraggableResource: React.FC<Props> = ({ dragId, dragData, className, children, ...rest }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId, data: dragData });
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isDragging ? 'dragging' : ''}`.trim()}
      {...rest}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

export default DraggableResource;
