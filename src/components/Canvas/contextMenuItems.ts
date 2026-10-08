import { useEditorStore } from '../../store/editorStore';
import type { ContextMenuItem } from '../ContextMenu';
import {
  hasClipboard,
  copySelectedComponents,
  cutSelectedComponents,
  pasteClipboardComponents,
  duplicateSelectedComponents,
  selectAllComponents,
} from '../../hooks/useKeyboardShortcuts';
import { t } from '../../i18n';

type EditorActions = ReturnType<typeof useEditorStore.getState>;

export interface ContextMenuDeps {
  saveToHistory: EditorActions['saveToHistory'];
  deleteComponents: EditorActions['deleteComponents'];
  bringToFront: EditorActions['bringToFront'];
  bringForward: EditorActions['bringForward'];
  sendBackward: EditorActions['sendBackward'];
  sendToBack: EditorActions['sendToBack'];
}

/** Items of the canvas context menu; selection is read from the store inside, so the menu is always current. */
export function buildContextMenuItems({ saveToHistory, deleteComponents, bringToFront, bringForward, sendBackward, sendToBack }: ContextMenuDeps): ContextMenuItem[] {
  const state = useEditorStore.getState();
  const sIds = state.selection.selectedIds;
  const hasSelection = sIds.length > 0;
  const hasMultiple = sIds.length > 1;
  
  const items: ContextMenuItem[] = [
    {
      id: 'copy',
      label: t('Copy'),
      icon: '📋',
      shortcut: 'Ctrl+C',
      disabled: !hasSelection,
      onClick: () => {
        copySelectedComponents();
      },
    },
    {
      id: 'cut',
      label: t('Cut'),
      icon: '✂️',
      shortcut: 'Ctrl+X',
      disabled: !hasSelection,
      onClick: () => {
        cutSelectedComponents();
      },
    },
    {
      id: 'paste',
      label: t('Paste'),
      icon: '📄',
      shortcut: 'Ctrl+V',
      disabled: !hasClipboard(),
      onClick: () => {
        pasteClipboardComponents();
      },
    },
    {
      id: 'duplicate',
      label: t('Duplicate'),
      icon: '⧉',
      shortcut: 'Ctrl+D',
      disabled: !hasSelection,
      onClick: () => {
        duplicateSelectedComponents();
      },
    },
    { id: 'divider1', label: '', divider: true },
    {
      id: 'delete',
      label: t('Delete'),
      icon: '🗑️',
      shortcut: 'Delete',
      disabled: !hasSelection,
      onClick: () => {
        const s = useEditorStore.getState();
        saveToHistory();
        deleteComponents(s.selection.selectedIds);
      },
    },
    { id: 'divider2', label: '', divider: true },
    {
      id: 'bring-front',
      label: t('Bring to front'),
      icon: '⬆️',
      disabled: !hasSelection || hasMultiple,
      onClick: () => {
        const s = useEditorStore.getState();
        if (s.selection.selectedIds.length === 1) {
          bringToFront(s.selection.selectedIds[0]);
        }
      },
    },
    {
      id: 'bring-forward',
      label: t('Move up one layer'),
      icon: '↑',
      disabled: !hasSelection || hasMultiple,
      onClick: () => {
        const s = useEditorStore.getState();
        if (s.selection.selectedIds.length === 1) {
          bringForward(s.selection.selectedIds[0]);
        }
      },
    },
    {
      id: 'send-backward',
      label: t('Move down one layer'),
      icon: '↓',
      disabled: !hasSelection || hasMultiple,
      onClick: () => {
        const s = useEditorStore.getState();
        if (s.selection.selectedIds.length === 1) {
          sendBackward(s.selection.selectedIds[0]);
        }
      },
    },
    {
      id: 'send-back',
      label: t('Send to back'),
      icon: '⬇️',
      disabled: !hasSelection || hasMultiple,
      onClick: () => {
        const s = useEditorStore.getState();
        if (s.selection.selectedIds.length === 1) {
          sendToBack(s.selection.selectedIds[0]);
        }
      },
    },
    { id: 'divider3', label: '', divider: true },
    {
      id: 'select-all',
      label: t('Select all'),
      icon: '☑️',
      shortcut: 'Ctrl+A',
      onClick: () => {
        selectAllComponents();
      },
    },
  ];
  
  return items;
}
