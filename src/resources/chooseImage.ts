import { useEditorStore } from '../store/editorStore';
import { quickAddComponent } from '../utils/quickAdd';
import { useResourceStore } from './resourceStore';
import { getIconImageResource } from './iconToImage';

/** The image component currently waiting for a resource (still selected), if any. */
export function activePickTarget(): string | null {
  const id = useResourceStore.getState().pickTarget;
  const sel = useEditorStore.getState().selection.selectedIds;
  return id && sel.length === 1 && sel[0] === id && useEditorStore.getState().getComponentById(id) ? id : null;
}

/**
 * A click on an image / icon in the resource manager: fills the image component the user
 * clicked on the canvas, or adds a new image component when none is waiting.
 */
export function chooseImage(imageId: string, width: number, height: number) {
  const editor = useEditorStore.getState();
  const target = activePickTarget();
  if (target) {
    const comp = editor.getComponentById(target)!;
    editor.updateComponent(target, { props: { ...comp.props, src: imageId } });
    useResourceStore.getState().setPickTarget(null);
    return;
  }
  const scale = Math.min(1, 160 / Math.max(width, height, 1));
  const id = quickAddComponent('img');
  if (!id) return;
  useEditorStore.getState().updateComponent(id, {
    width: Math.max(8, Math.round(width * scale)),
    height: Math.max(8, Math.round(height * scale)),
    props: { ...(useEditorStore.getState().getComponentById(id)?.props ?? {}), src: imageId },
  });
}

export function chooseIcon(name: string, path: string, onError: () => void) {
  getIconImageResource(name, path).then(img => chooseImage(img.id, 48, 48)).catch(onError);
}
