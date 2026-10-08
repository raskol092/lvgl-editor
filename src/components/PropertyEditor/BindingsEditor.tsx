// "Bindings" section: keeps a property of the component in sync with a logic variable.
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ComponentBinding, LvglComponent } from '../../types';
import { useLogicEditorStore } from '../LogicEditor/logicEditorStore';
import { t } from '../../i18n';

const KINDS: Array<[ComponentBinding['kind'], string]> = [
  ['text', t('Text')], ['value', t('Value')], ['hidden', t('Hidden when')], ['disabled', t('Disabled when')], ['checked', t('Checked when')],
];
const OPS: Array<[string, string]> = [['', t('is not zero')], ['==', '='], ['!=', '≠'], ['>', '>'], ['<', '<'], ['>=', '≥'], ['<=', '≤']];

/** Kinds that make sense for a widget type */
function kindsFor(type: string): Array<[ComponentBinding['kind'], string]> {
  const hasText = ['label', 'btn', 'checkbox', 'textarea'].includes(type);
  const hasValue = ['slider', 'bar', 'arc', 'roller', 'spinbox', 'led', 'dropdown', 'switch', 'checkbox', 'scale'].includes(type);
  const hasChecked = ['switch', 'checkbox', 'btn', 'obj'].includes(type);
  return KINDS.filter(([k]) => (k === 'text' ? hasText : k === 'value' ? hasValue : k === 'checked' ? hasChecked : true));
}

const BindingsEditor: React.FC<{ component: LvglComponent; onChange: (bindings: ComponentBinding[]) => void }> = ({ component, onChange }) => {
  const graphs = useLogicEditorStore(s => s.graphs);
  const vars = [...new Map(graphs.flatMap(g => g.variables).map(v => [v.name, v])).values()];
  const list = component.bindings || [];
  const kinds = kindsFor(component.type);
  const update = (id: string, patch: Partial<ComponentBinding>) => onChange(list.map(b => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <div className="property-section">
      <div className="section-header">{t('Bindings')}</div>
      {vars.length === 0 && <div className="inherit-hint" style={{ padding: '4px 0' }}>{t('Create a variable in the Logic tab first')}</div>}
      {list.map(b => (
        <div key={b.id} style={{ border: '1px solid var(--border, #ddd)', borderRadius: 6, padding: 6, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="property-row">
            <select value={b.kind} onChange={(e) => update(b.id, { kind: e.target.value as ComponentBinding['kind'] })}>
              {kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button onClick={() => onChange(list.filter(x => x.id !== b.id))} title={t('Delete')}>×</button>
          </div>
          <div className="property-row">
            <label>{t('Variable')}</label>
            <select value={b.variable} onChange={(e) => update(b.id, { variable: e.target.value })}>
              <option value="">{t('Select...')}</option>
              {vars.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          {b.kind === 'text' && (
            <div className="property-row">
              <label>{t('Format (printf)')}</label>
              <input type="text" value={b.format || ''} placeholder="%.1f km/h" onChange={(e) => update(b.id, { format: e.target.value })} />
            </div>
          )}
          {(b.kind === 'hidden' || b.kind === 'disabled' || b.kind === 'checked') && (
            <div className="property-row">
              <select value={b.op || ''} onChange={(e) => update(b.id, { op: e.target.value as ComponentBinding['op'] })}>
                {OPS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              {b.op ? <input type="number" value={b.compare ?? 0} onChange={(e) => update(b.id, { compare: parseFloat(e.target.value) || 0 })} /> : null}
            </div>
          )}
        </div>
      ))}
      <button
        className="clear-override-btn"
        disabled={vars.length === 0}
        onClick={() => onChange([...list, { id: uuidv4(), kind: kinds[0][0], variable: vars[0]?.name || '' }])}
      >
        {t('+ Add binding')}
      </button>
    </div>
  );
};

export default BindingsEditor;
