import { useEditorStore } from '../store/editorStore';
import { getComponentDefinition } from './componentDefinitions';

/**
 * Click-to-add: puts a new component on the current page without dragging.
 * It goes into the selected container (if any), cascaded so repeated clicks don't stack exactly.
 * Returns the new component id ('' when the type is unknown).
 */
export function quickAddComponent(type: string): string {
  const store = useEditorStore.getState();
  const def = getComponentDefinition(type);
  if (!def) return '';
  const sel = store.selection.selectedIds.length === 1 ? store.getComponentById(store.selection.selectedIds[0]) : undefined;
  const parent = sel && getComponentDefinition(sel.type)?.isContainer ? sel : undefined;
  const page = store.pages.find(p => p.id === store.currentPageId);
  const siblings = parent ? parent.children.length : (page?.components.length ?? 0);
  const bounds = parent ? { w: parent.width, h: parent.height } : { w: store.canvas.width, h: store.canvas.height };
  const step = 16 + (siblings % 10) * 16;
  const x = Math.max(0, Math.min(step, bounds.w - def.defaultWidth));
  const y = Math.max(0, Math.min(step, bounds.h - def.defaultHeight));
  const id = store.addComponent(type, x, y, parent?.id ?? null);
  if (id) useEditorStore.getState().selectComponent(id);
  return id;
}
