import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import { isNameTaken } from '../../../utils/uniqueName';
import { t } from '../../../i18n';

/** Component name field: a name already used on the screen (or an empty one) is refused, the old name is kept. */
export function NameInput({ id, name, onCommit }: { id: string; name: string; onCommit: (name: string) => void }): React.ReactElement {
  const [draft, setDraft] = useState(name);
  const page = useEditorStore(s => s.pages.find(p => p.id === s.currentPageId));
  useEffect(() => { setDraft(name); }, [name, id]);
  const value = draft.trim();
  const error = value === '' ? t('The name cannot be empty') : page && isNameTaken(page.components, value, id) ? t('This name is already used on this screen') : '';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <input
        type="text"
        value={draft}
        style={error ? { borderColor: '#e53935', outlineColor: '#e53935' } : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = e.target.value.trim();
          if (v && v !== name && page && !isNameTaken(page.components, v, id)) onCommit(v);
        }}
        onBlur={() => { if (error) setDraft(name); }}
      />
      {error && <span style={{ color: '#e53935', fontSize: 11 }}>{error}</span>}
    </div>
  );
}
