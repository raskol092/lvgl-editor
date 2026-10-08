import Emoji from '../icons/Emoji';
// Node Edit Dialog - Edit node parameters

import React, { useState, useCallback, useEffect } from 'react';
import { useLogicEditorStore } from './logicEditorStore';
import { useEditorStore } from '../../store/editorStore';
import type { CompareOperator, LogicOperator, MathOperator, StringOperation } from './types';
import { LVGL_EVENTS } from '../EventPanel/EventPanel';
import { t } from '../../i18n';
import './NodeEditDialog.css';

interface NodeEditDialogProps {
  nodeId: string;
  onClose: () => void;
}

/** Widgets whose value can be read (display widgets such as bar or label only receive values) */
const READABLE_TYPES = ['slider', 'arc', 'switch', 'checkbox', 'dropdown', 'textarea', 'roller', 'spinbox'];

const COMPARE_OPERATORS: { value: CompareOperator; label: string }[] = [
  { value: '==', label: t('Equal (==)') },
  { value: '!=', label: t('Not equal (!=)') },
  { value: '>', label: t('Greater than (>)') },
  { value: '<', label: t('Less than (<)') },
  { value: '>=', label: t('Greater or equal (>=)') },
  { value: '<=', label: t('Less or equal (<=)') },
];

const LOGIC_OPERATORS: { value: LogicOperator; label: string }[] = [
  { value: 'AND', label: t('AND') },
  { value: 'OR', label: t('OR') },
  { value: 'NOT', label: t('NOT') },
];

const MATH_OPERATORS: { value: MathOperator; label: string }[] = [
  { value: '+', label: t('Add (+)') },
  { value: '-', label: t('Subtract (-)') },
  { value: '*', label: t('Multiply (*)') },
  { value: '/', label: t('Divide (/)') },
  { value: '%', label: t('Modulo (%)') },
  { value: 'min', label: t('Smaller of A and B') },
  { value: 'max', label: t('Larger of A and B') },
  { value: 'pow', label: t('Power (A^B)') },
];

const MATH_FUNCS: { value: string; label: string }[] = [
  { value: 'abs', label: t('Absolute value') }, { value: 'sqrt', label: t('Square root') },
  { value: 'floor', label: t('Round down') }, { value: 'ceil', label: t('Round up') }, { value: 'round', label: t('Round') },
  { value: 'sin', label: t('Sine (radians)') }, { value: 'cos', label: t('Cosine (radians)') },
];

const STRING_OPERATIONS: { value: StringOperation; label: string }[] = [
  { value: 'concat', label: t('Concatenate') },
  { value: 'format', label: t('Format') },
  { value: 'substring', label: t('Substring') },
  { value: 'length', label: t('Length') },
];

const NodeEditDialog: React.FC<NodeEditDialogProps> = ({ nodeId, onClose }) => {
  const { getNode, updateNode, getVariables } = useLogicEditorStore();
  const { pages, getAllComponents } = useEditorStore();
  
  const node = getNode(nodeId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [params, setParams] = useState<Record<string, any>>(node?.params || {});
  const [label, setLabel] = useState(node?.label || '');

  const variables = getVariables();
  const allComponents = getAllComponents();

  useEffect(() => {
    if (node) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local state with node props
      setParams(node.params);
      setLabel(node.label);
    }
  }, [node]);

  const handleSave = useCallback(() => {
    updateNode(nodeId, { params, label });
    onClose();
  }, [nodeId, params, label, updateNode, onClose]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleParamChange = useCallback((key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  if (!node) {
    return null;
  }

  const renderParamEditor = () => {
    switch (node.subType) {
      case 'event_trigger':
        return (
          <div className="param-group">
            <label>{t('Event type')}</label>
            <select
              value={params.eventType || 'LV_EVENT_CLICKED'}
              onChange={e => handleParamChange('eventType', e.target.value)}
            >
              {LVGL_EVENTS.map(evt => (
                <option key={evt.type} value={evt.type}>
                  {evt.label} ({evt.type})
                </option>
              ))}
            </select>
          </div>
        );

      case 'timer_trigger':
        return (
          <>
            <div className="param-group">
              <label>{t('Mode')}</label>
              <select
                value={params.mode || 'delay'}
                onChange={e => handleParamChange('mode', e.target.value)}
              >
                <option value="delay">{t('Delayed run')}</option>
                <option value="interval">{t('Periodic run')}</option>
              </select>
            </div>
            <div className="param-group">
              <label>{t('Time (ms)')}</label>
              <input
                type="number"
                min="0"
                step="100"
                value={params.duration || 1000}
                onChange={e => handleParamChange('duration', parseInt(e.target.value) || 0)}
              />
            </div>
          </>
        );

      case 'compare':
        return (
          <div className="param-group">
            <label>{t('Comparison operator')}</label>
            <select
              value={params.operator || '=='}
              onChange={e => handleParamChange('operator', e.target.value)}
            >
              {COMPARE_OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        );

      case 'logic_op':
        return (
          <div className="param-group">
            <label>{t('Logic operator')}</label>
            <select
              value={params.operator || 'AND'}
              onChange={e => handleParamChange('operator', e.target.value)}
            >
              {LOGIC_OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        );

      case 'math_op':
        return (
          <div className="param-group">
            <label>{t('Math operator')}</label>
            <select
              value={params.operator || '+'}
              onChange={e => handleParamChange('operator', e.target.value)}
            >
              {MATH_OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        );

      case 'string_op':
        return (
          <div className="param-group">
            <label>{t('String operation')}</label>
            <select
              value={params.operation || 'concat'}
              onChange={e => handleParamChange('operation', e.target.value)}
            >
              {STRING_OPERATIONS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
        );

      case 'math_func':
        return (
          <div className="param-group">
            <label>{t('Function')}</label>
            <select value={params.func || 'abs'} onChange={e => handleParamChange('func', e.target.value)}>
              {MATH_FUNCS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        );

      case 'to_string':
        return (
          <div className="param-group">
            <label>{t('Format (printf)')}</label>
            <input type="text" value={params.format || '%d'} onChange={e => handleParamChange('format', e.target.value)} placeholder="%.1f" />
          </div>
        );

      case 'delay':
        return (
          <div className="param-group">
            <label>{t('Delay (ms)')}</label>
            <input
              type="number"
              min="0"
              step="100"
              value={params.duration || 1000}
              onChange={e => handleParamChange('duration', parseInt(e.target.value) || 0)}
            />
          </div>
        );

      case 'navigate_page':
        return (
          <>
            <div className="param-group">
              <label>{t('Target page')}</label>
              <select
                value={params.targetPage || ''}
                onChange={e => handleParamChange('targetPage', e.target.value)}
              >
                <option value="">{t('Select page...')}</option>
                {pages.map(page => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
            </div>
            <div className="param-group">
              <label>{t('Animation')}</label>
              <select
                value={params.animation || 'none'}
                onChange={e => handleParamChange('animation', e.target.value)}
              >
                <option value="none">{t('None')}</option>
                <option value="fade">{t('Fade')}</option>
                <option value="slide_left">{t('Slide left')}</option>
                <option value="slide_right">{t('Slide right')}</option>
              </select>
            </div>
          </>
        );

      case 'show_hide':
        return (
          <>
            <div className="param-group">
              <label>{t('Target component')}</label>
              <select
                value={params.targetComponent || ''}
                onChange={e => handleParamChange('targetComponent', e.target.value)}
              >
                <option value="">{t('Select component...')}</option>
                {allComponents.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="param-group">
              <label>{t('Action')}</label>
              <select
                value={params.action || 'toggle'}
                onChange={e => handleParamChange('action', e.target.value)}
              >
                <option value="show">{t('Show')}</option>
                <option value="hide">{t('Hide')}</option>
                <option value="toggle">{t('Toggle')}</option>
              </select>
            </div>
          </>
        );

      case 'set_property':
      case 'get_property':
        return (
          <>
            <div className="param-group">
              <label>{t('Target component')}</label>
              <select
                value={params.targetComponent || ''}
                onChange={e => handleParamChange('targetComponent', e.target.value)}
              >
                <option value="">{t('Select component...')}</option>
                {(node.subType === 'get_property' ? allComponents.filter(comp => READABLE_TYPES.includes(comp.type)) : allComponents).map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="param-group">
              <label>{t('Property')}</label>
              <select
                value={params.property || ''}
                onChange={e => handleParamChange('property', e.target.value)}
              >
                <option value="">{t('Select property...')}</option>
                <option value="x">{t('X position')}</option>
                <option value="y">{t('Y position')}</option>
                <option value="width">{t('Width')}</option>
                <option value="height">{t('Height')}</option>
                <option value="visible">{t('Visibility')}</option>
                <option value="opacity">{t('Opacity')}</option>
                <option value="text">{t('Text')}</option>
                <option value="value">{t('Value')}</option>
                <option value="checked">{t('Checked state')}</option>
              </select>
            </div>
          </>
        );

      case 'set_text':
      case 'set_value':
        return (
          <div className="param-group">
            <label>{t('Target component')}</label>
            <select
              value={params.targetComponent || ''}
              onChange={e => handleParamChange('targetComponent', e.target.value)}
            >
              <option value="">{t('Select component...')}</option>
              {allComponents.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.type})
                </option>
              ))}
            </select>
          </div>
        );

      case 'var_read':
      case 'var_write':
        return (
          <div className="param-group">
            <label>{t('Variables')}</label>
            <select
              value={params.variableId || ''}
              onChange={e => handleParamChange('variableId', e.target.value)}
            >
              <option value="">{t('Select variable...')}</option>
              {variables.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.type})
                </option>
              ))}
            </select>
          </div>
        );

      case 'call_function':
        return (
          <>
            <div className="param-group">
              <label>{t('Function name')}</label>
              <input
                type="text"
                placeholder="my_function"
                value={params.functionName || ''}
                onChange={e => handleParamChange('functionName', e.target.value)}
              />
            </div>
            <div className="param-group">
              <label>{t('Parameter description')}</label>
              <textarea
                placeholder={t('Function parameter description...')}
                value={params.description || ''}
                onChange={e => handleParamChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </>
        );

      case 'c_code_block':
        return (
          <div className="param-group">
            <label>{t('Lisp code')}</label>
            <textarea
              className="code-textarea"
              placeholder={t(';; Custom Lisp code')}
              value={params.code || ''}
              onChange={e => handleParamChange('code', e.target.value)}
              rows={8}
              spellCheck={false}
            />
          </div>
        );

      case 'switch':
        return (
          <div className="param-group">
            <label>{t('Branch count')}</label>
            <input
              type="number"
              min="2"
              max="10"
              value={params.cases?.length || 3}
              onChange={e => {
                const count = Math.max(2, Math.min(10, parseInt(e.target.value) || 2));
                handleParamChange('cases', Array.from({ length: count }, (_, i) => i));
              }}
            />
          </div>
        );

      default:
        return (
          <div className="no-params">
            <p>{t('This node has no configurable parameters')}</p>
          </div>
        );
    }
  };

  return (
    <div className="node-edit-dialog-overlay" onClick={onClose}>
      <div className="node-edit-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{t('Edit node')}</h3>
          <button className="close-btn" onClick={onClose}><Emoji c="✕" /></button>
        </div>

        <div className="dialog-body">
          {/* Node Label */}
          <div className="param-group">
            <label>{t('Node name')}</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={t('Node name')}
            />
          </div>

          {/* Node Type Info */}
          <div className="node-type-info">
            <span className="type-badge" style={{ backgroundColor: getNodeColor(node.type) }}>
              {node.type}
            </span>
            <span className="subtype-label">{node.subType}</span>
          </div>

          {/* Parameters */}
          <div className="params-section">
            <h4>{t('Parameters')}</h4>
            {renderParamEditor()}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn-cancel" onClick={onClose}>{t('Cancel')}</button>
          <button className="btn-save" onClick={handleSave}>{t('Save')}</button>
        </div>
      </div>
    </div>
  );
};

function getNodeColor(type: string): string {
  switch (type) {
    case 'trigger': return '#4CAF50';
    case 'condition': return '#FFC107';
    case 'action': return '#2196F3';
    case 'data': return '#9C27B0';
    case 'custom': return '#607D8B';
    default: return '#666';
  }
}

export default NodeEditDialog;
