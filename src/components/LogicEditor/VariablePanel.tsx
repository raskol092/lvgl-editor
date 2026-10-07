import Emoji from '../icons/Emoji';
// Variable Panel - Manage global variables

import React, { useState, useCallback } from 'react';
import { useLogicEditorStore } from './logicEditorStore';
import type { LogicVariable, VariableType } from './types';
import { modal } from '../Modal';
import { useEditorStore } from '../../store/editorStore';
import type { LvglComponent } from '../../types';
import ToolIcon from '../icons/ToolIcon';
import { t } from '../../i18n';
import './VariablePanel.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VARIABLE_TYPES: { type: VariableType; label: string; icon: string; defaultValue: any }[] = [
  { type: 'int', label: t('Integer'), icon: '🔢', defaultValue: 0 },
  { type: 'float', label: t('Float'), icon: '📊', defaultValue: 0.0 },
  { type: 'string', label: t('String'), icon: '📝', defaultValue: '' },
  { type: 'bool', label: t('Boolean'), icon: '✓', defaultValue: false },
];

/** The property a screen element exposes to the logic by default */
function mainProperty(type: string): string {
  switch (type) {
    case 'slider': case 'bar': case 'arc': case 'dropdown': return 'value';
    case 'switch': case 'checkbox': return 'checked';
    case 'label': case 'btn': case 'textarea': return 'text';
    default: return 'visible';
  }
}

/** Widgets the user (or the board) changes: their value can be read. Display widgets (bar, label, chart...) only receive values. */
function canReadValue(type: string): boolean {
  return ['slider', 'arc', 'switch', 'checkbox', 'dropdown', 'textarea'].includes(type);
}

const PROPERTY_LABEL: Record<string, string> = { value: 'Value', checked: 'Checked state', text: 'Text', visible: 'Visibility' };

function flatten(list: LvglComponent[], out: LvglComponent[] = []): LvglComponent[] {
  for (const c of list) { out.push(c); flatten(c.children, out); }
  return out;
}

const VariablePanel: React.FC = () => {
  const { getVariables, addVariable, deleteVariable, updateVariable, getCurrentGraph, addNode, updateNode } = useLogicEditorStore();
  const pages = useEditorStore(state => state.pages);
  const [isAdding, setIsAdding] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('int');
  const [editingId, setEditingId] = useState<string | null>(null);

  const variables = getVariables();
  const currentGraph = getCurrentGraph();

  const handleAddVariable = useCallback(() => {
    if (!newVarName.trim()) return;
    
    const typeInfo = VARIABLE_TYPES.find(t => t.type === newVarType);
    addVariable(newVarName.trim(), newVarType, typeInfo?.defaultValue ?? 0);
    
    setNewVarName('');
    setNewVarType('int');
    setIsAdding(false);
  }, [newVarName, newVarType, addVariable]);

  const handleDeleteVariable = useCallback(async (id: string) => {
    if (await modal.confirm(t('Delete this variable?'))) {
      deleteVariable(id);
    }
  }, [deleteVariable]);

  const handleUpdateValue = useCallback((id: string, value: string, type: VariableType) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedValue: any = value;
    
    switch (type) {
      case 'int':
        parsedValue = parseInt(value, 10) || 0;
        break;
      case 'float':
        parsedValue = parseFloat(value) || 0;
        break;
      case 'bool':
        parsedValue = value === 'true';
        break;
      case 'string':
      default:
        parsedValue = value;
    }
    
    updateVariable(id, { defaultValue: parsedValue });
    setEditingId(null);
  }, [updateVariable]);

  const elements = pages.flatMap(page => flatten(page.components).map(comp => ({ comp, page: page.name })));

  /** Adds a "Get property" / "Set property" node already pointing at the element */
  const addElementNode = (comp: LvglComponent, mode: 'read' | 'write') => {
    if (!currentGraph) return;
    const n = currentGraph.nodes.length;
    const x = 80 + (n % 4) * 40;
    const y = 80 + n * 30;
    const id = mode === 'read' ? addNode('data', 'get_property', x, y) : addNode('action', 'set_property', x, y);
    if (id) updateNode(id, { params: { targetComponent: comp.id, property: mainProperty(comp.type), ...(mode === 'write' ? { value: 0 } : {}) } });
  };

  const elementsSection = (
    <>
      {/* Elements placed on the screens: read or write their value from the logic */}
      <div className="panel-header elements-header">
        <h3>{t('Screen elements')}</h3>
      </div>
      <div className="variable-list element-list">
        {elements.length === 0 ? (
          <div className="no-variables"><p>{t('No components on the screens yet')}</p></div>
        ) : (
          elements.map(({ comp, page }) => (
            <div className="variable-item element-item" key={comp.id} title={`${page} / ${comp.name}`}>
              <div className="var-icon"><ToolIcon name={comp.type} size={16} /></div>
              <div className="var-info">
                <span className="var-name">{comp.name}</span>
                <span className="var-type">{t(PROPERTY_LABEL[mainProperty(comp.type)])}</span>
              </div>
              <div className="var-actions">
                {canReadValue(comp.type) && (
                  <button className="btn-element" disabled={!currentGraph} onClick={() => addElementNode(comp, 'read')} title={t('Add a node that reads it')}>↓</button>
                )}
                <button className="btn-element" disabled={!currentGraph} onClick={() => addElementNode(comp, 'write')} title={t('Add a node that writes it')}>↑</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  if (!currentGraph) {
    return (
      <div className="variable-panel">
        <div className="panel-header">
          <h3>{t('Variables')}</h3>
        </div>
        <div className="no-graph">
          <p>{t('Select or create a logic graph first')}</p>
        </div>
        {elementsSection}
      </div>
    );
  }

  return (
    <div className="variable-panel">
      <div className="panel-header">
        <h3>{t('Variables')}</h3>
        <button 
          className="add-var-btn" 
          onClick={() => setIsAdding(true)}
          title={t('Add variable')}
        >
          +
        </button>
      </div>

      {/* Add Variable Form */}
      {isAdding && (
        <div className="add-var-form">
          <input
            type="text"
            placeholder={t('Variable name')}
            value={newVarName}
            onChange={e => setNewVarName(e.target.value)}
            autoFocus
          />
          <select
            value={newVarType}
            onChange={e => setNewVarType(e.target.value as VariableType)}
          >
            {VARIABLE_TYPES.map(t => (
              <option key={t.type} value={t.type}>
                <Emoji c={t.icon} /> {t.label}
              </option>
            ))}
          </select>
          <div className="form-actions">
            <button className="btn-confirm" onClick={handleAddVariable}>
              {t('Add')}
            </button>
            <button className="btn-cancel" onClick={() => setIsAdding(false)}>
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Variable List */}
      <div className="variable-list">
        {variables.length === 0 ? (
          <div className="no-variables">
            <p>{t('No variables')}</p>
            <button onClick={() => setIsAdding(true)}>{t('+ Add variable')}</button>
          </div>
        ) : (
          variables.map(variable => (
            <VariableItem
              key={variable.id}
              variable={variable}
              isEditing={editingId === variable.id}
              onEdit={() => setEditingId(variable.id)}
              onSave={(value) => handleUpdateValue(variable.id, value, variable.type)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDeleteVariable(variable.id)}
            />
          ))
        )}
      </div>

      {elementsSection}
    </div>
  );
};

// Variable Item Component
interface VariableItemProps {
  variable: LogicVariable;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const VariableItem: React.FC<VariableItemProps> = ({
  variable,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [editValue, setEditValue] = useState(String(variable.defaultValue));
  const typeInfo = VARIABLE_TYPES.find(t => t.type === variable.type);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const renderValueInput = () => {
    if (variable.type === 'bool') {
      return (
        <select
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => onSave(editValue)}
          autoFocus
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    
    return (
      <input
        type={variable.type === 'string' ? 'text' : 'number'}
        step={variable.type === 'float' ? '0.1' : '1'}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={() => onSave(editValue)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  };

  return (
    <div className="variable-item">
      <div className="var-icon"><Emoji c={typeInfo?.icon || '📦'} /></div>
      <div className="var-info">
        <span className="var-name">{variable.name}</span>
        <span className="var-type">{typeInfo?.label || variable.type}</span>
      </div>
      <div className="var-value">
        {isEditing ? (
          renderValueInput()
        ) : (
          <span className="value-display" onClick={onEdit}>
            {variable.type === 'string' ? `"${variable.defaultValue}"` : String(variable.defaultValue)}
          </span>
        )}
      </div>
      <div className="var-actions">
        <button className="btn-delete" onClick={onDelete} title={t('Delete')}>
          <Emoji c="🗑" />
        </button>
      </div>
    </div>
  );
};

export default VariablePanel;
