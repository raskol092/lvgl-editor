import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useEditorStore } from '../store/editorStore';
import type { LvglComponent } from '../types';
import { getComponentDefinition } from '../utils/componentDefinitions';
import { getIconImageResource } from '../resources/iconToImage';
import { toast } from '../components/Toast';
import { t } from '../i18n';

/** Drag & drop of palette items (components, icons, images) onto the canvas. */
export function useCanvasDragDrop() {
  const addComponent = useEditorStore(s => s.addComponent);
  // Track dragging state for overlay
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [activeDragIcon, setActiveDragIcon] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === 'new-component') {
      setActiveDragType(data.componentType);
    } else if (data?.type === 'new-icon') {
      setActiveDragIcon(data.path as string);
    } else if (data?.type === 'new-image') {
      setActiveDragIcon(null);
      setActiveDragType('img');
    }
  }, []);

  // Track last mouse position for accurate drop placement
  const lastMousePos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  /** Where a new component of the given size lands when dropped at the pointer (null: not over the canvas). */
  const resolveDrop = useCallback((width: number, height: number) => {
    const canvasElement = document.querySelector('.canvas');
    if (!canvasElement) return null;
    const rect = canvasElement.getBoundingClientRect();
    const currentCanvas = useEditorStore.getState().canvas;

    // Use tracked mouse position — immune to CSS transform issues with dnd-kit delta
    const dropX = (lastMousePos.current.x - rect.left) / currentCanvas.zoom;
    const dropY = (lastMousePos.current.y - rect.top) / currentCanvas.zoom;

    const state = useEditorStore.getState();
    const currentPage = state.pages.find(p => p.id === state.currentPageId);
    const components = currentPage?.components || [];

    type HitResult = { comp: LvglComponent; absX: number; absY: number } | null;

    const findDeepestContainer = (comps: LvglComponent[], offsetX: number, offsetY: number): HitResult => {
      // Iterate in reverse so top-most (last rendered) components are checked first
      for (let i = comps.length - 1; i >= 0; i--) {
        const comp = comps[i];
        const absX = comp.x + offsetX;
        const absY = comp.y + offsetY;
        if (dropX >= absX && dropX <= absX + comp.width && dropY >= absY && dropY <= absY + comp.height) {
          const def = getComponentDefinition(comp.type);
          if (def?.isContainer) {
            const deeper = findDeepestContainer(comp.children, absX, absY);
            return deeper || { comp, absX, absY };
          }
        }
      }
      return null;
    };

    const container = findDeepestContainer(components, 0, 0);
    let x = dropX;
    let y = dropY;
    let parentId: string | null = null;
    if (container) {
      x = dropX - container.absX;
      y = dropY - container.absY;
      parentId = container.comp.id;
    }

    // Center the component on the drop point
    x -= width / 2;
    y -= height / 2;

    if (container) {
      x = Math.max(0, Math.min(x, container.comp.width - (width || 50)));
      y = Math.max(0, Math.min(y, container.comp.height - (height || 50)));
    } else {
      x = Math.max(0, Math.min(x, currentCanvas.width - 50));
      y = Math.max(0, Math.min(y, currentCanvas.height - 50));
    }
    return { x, y, parentId };
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragType(null);
    setActiveDragIcon(null);
    const data = active.data.current;
    if (over?.id !== 'canvas-drop-area' || !data) return;

    if (data.type === 'new-component') {
      const definition = getComponentDefinition(data.componentType);
      const drop = resolveDrop(definition?.defaultWidth ?? 100, definition?.defaultHeight ?? 50);
      if (drop) addComponent(data.componentType, drop.x, drop.y, drop.parentId);
      return;
    }

    // Resources dragged from the resource manager become image components
    const placeImage = (imageId: string, w: number, h: number) => {
      const drop = resolveDrop(w, h);
      if (!drop) return;
      const id = addComponent('img', drop.x, drop.y, drop.parentId);
      const store = useEditorStore.getState();
      const comp = store.getComponentById(id);
      store.updateComponent(id, { width: w, height: h, props: { ...(comp?.props ?? {}), src: imageId } });
    };

    if (data.type === 'new-image') {
      const scale = Math.min(1, 160 / Math.max(data.width, data.height));
      placeImage(data.imageId, Math.max(8, Math.round(data.width * scale)), Math.max(8, Math.round(data.height * scale)));
    } else if (data.type === 'new-icon') {
      getIconImageResource(data.iconName as string, data.path as string)
        .then(img => placeImage(img.id, 48, 48))
        .catch(() => toast.error(t('Failed to add icon')));
    }
  }, [addComponent, resolveDrop]);

  return { activeDragType, activeDragIcon, handleDragStart, handleDragEnd };
}
