import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../store/editorStore';
import type { EventBinding, LvglEventType, BuiltinActionType, BuiltinAction } from '../../types';
import { LVGL_EVENTS } from './EventPanel';
import CodeEditor from './CodeEditor';
import { t } from '../../i18n';
import './EventEditDialog.css';

interface EventEditDialogProps {
  event: EventBinding | null;
  isCreating: boolean;
  onSave: (event: EventBinding) => void;
  onClose: () => void;
}

const BUILTIN_ACTIONS: { type: BuiltinActionType; label: string; description: string }[] = [
  { type: 'navigate', label: t('Navigate to page'), description: t('Switch to the specified page') },
  { type: 'setProperty', label: t('Set property'), description: t('Set a component property value') },
  { type: 'show', label: t('Show component'), description: t('Show the specified component') },
  { type: 'hide', label: t('Hide component'), description: t('Hide the specified component') },
  { type: 'enable', label: t('Enable component'), description: t('Enable the specified component') },
  { type: 'disable', label: t('Disable component'), description: t('Disable the specified component') },
  { type: 'setText', label: t('Set text'), description: t('Set the component\'s text content') },
  { type: 'setValue', label: t('Set value'), description: t('Set the component\'s numeric value') },
  { type: 'setState', label: t('Set state'), description: t('Turn a state (checked, disabled, ...) on, off or toggle it') },
  { type: 'setFlag', label: t('Set flag'), description: t('Turn an object flag (hidden, clickable, ...) on, off or toggle it') },
];

const STATE_CHOICES: Array<[string, string]> = [
  ['checked', t('Checked')], ['disabled', t('Disabled')], ['focused', t('Focused state')], ['pressed', t('Press')],
  ['hovered', t('Hovered')], ['edited', t('Edited')], ['user_1', 'User 1'], ['user_2', 'User 2'],
];
const FLAG_CHOICES: Array<[string, string]> = [
  ['hidden', t('Hide')], ['clickable', t('Clickable')], ['checkable', t('Checkable')], ['scrollable', t('Scrollable')],
  ['floating', t('Floating')], ['ignore_layout', t('Ignore layout')], ['event_bubble', t('Event bubble')], ['press_lock', t('Press lock')],
];
const SCREEN_ANIMS: Array<[string, string]> = [
  ['none', t('None')], ['fade', t('Fade')], ['move_left', t('Move left')], ['move_right', t('Move right')],
  ['move_top', t('Move up')], ['move_bottom', t('Move down')], ['over_left', t('Over left')], ['over_right', t('Over right')],
  ['over_top', t('Over top')], ['over_bottom', t('Over bottom')],
];

const CODE_TEMPLATE = `;; Event handler code (LispBM)
;; The handler receives the event: e
;;   (lv-event-get-target-obj e), (lv-event-get-code e), (lv-event-get-user-data e)

;; Example: print a message
;; (print "Button clicked!")

;; Example: change label text
;; (lv-label-set-text ui-my-label "Clicked!")

`;

const EventEditDialog: React.FC<EventEditDialogProps> = ({
  event,
  isCreating,
  onSave,
  onClose,
}) => {
  const { pages, currentPageId, getAllComponents } = useEditorStore();
  
  // Suppress unused variable warning - currentPageId is used for reactivity
  void currentPageId;
  
  // Form state
  const [eventType, setEventType] = useState<LvglEventType>(
    event?.eventType || 'LV_EVENT_CLICKED'
  );
  const [handlerType, setHandlerType] = useState<'builtin' | 'custom'>(
    event?.handlerType || 'builtin'
  );
  const [actionType, setActionType] = useState<BuiltinActionType>(
    event?.action?.type || 'navigate'
  );
  const [targetPage, setTargetPage] = useState(event?.action?.targetPage || '');
  const [animation, setAnimation] = useState(event?.action?.animation || 'none');
  const [duration, setDuration] = useState<number>(event?.action?.duration ?? 300);
  const [targetComponent, setTargetComponent] = useState(event?.action?.targetComponent || '');
  const [property, setProperty] = useState(event?.action?.property || '');
  const [value, setValue] = useState<string>(
    event?.action?.value !== undefined ? String(event.action.value) : ''
  );
  const [customCode, setCustomCode] = useState(event?.customCode || CODE_TEMPLATE);
  const [showCodePreview, setShowCodePreview] = useState(false);

  // Get all components for target selection
  const allComponents = getAllComponents ? getAllComponents() : [];

  // Reset action fields when action type changes
  useEffect(() => {
    if (!event) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset fields when action type changes
      setTargetPage('');
      setTargetComponent('');
      setProperty('');
      setValue('');
    }
  }, [actionType, event]);

  const handleSave = useCallback(() => {
    const newEvent: EventBinding = {
      id: event?.id || uuidv4(),
      eventType,
      handlerType,
    };

    if (handlerType === 'builtin') {
      const action: BuiltinAction = { type: actionType };
      
      switch (actionType) {
        case 'navigate':
          action.targetPage = targetPage;
          if (animation !== 'none') { action.animation = animation; action.duration = duration; }
          break;
        case 'setState':
        case 'setFlag':
          action.targetComponent = targetComponent;
          action.property = property;
          action.value = value || 'on';
          break;
        case 'setProperty':
          action.targetComponent = targetComponent;
          action.property = property;
          action.value = value;
          break;
        case 'show':
        case 'hide':
        case 'enable':
        case 'disable':
          action.targetComponent = targetComponent;
          break;
        case 'setText':
          action.targetComponent = targetComponent;
          action.value = value;
          break;
        case 'setValue':
          action.targetComponent = targetComponent;
          action.value = parseFloat(value) || 0;
          break;
      }
      
      newEvent.action = action;
    } else {
      newEvent.customCode = customCode;
    }

    onSave(newEvent);
  }, [
    event, eventType, handlerType, actionType,
    targetPage, targetComponent, property, value, customCode, onSave, animation, duration
  ]);

  const generateCodePreview = (): string => {
    if (handlerType === 'custom') {
      return customCode;
    }

    const target = targetComponent ? `ui-${targetComponent.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'target';
    const page = targetPage ? targetPage.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'page-name';
    let code = `(defun ui-event-handler (e)\n`;
    code += `  (progn\n`;

    switch (actionType) {
      case 'navigate':
        code += `    ;; Navigate to page: ${targetPage || 'page_name'}\n`;
        code += `    (ui-load-screen-${page})\n`;
        break;
      case 'setState':
        code += `    ;; ${value || 'on'} state ${property || 'checked'}\n`;
        break;
      case 'setFlag':
        code += `    ;; ${value || 'on'} flag ${property || 'hidden'}\n`;
        break;
      case 'setProperty':
        code += `    ;; Set property: ${property || 'property'} = ${value || 'value'}\n`;
        code += `    (lv-obj-set-style-${(property || 'bg_color').replace(/_/g, '-')} ${target} ${value || '0'} LV_PART_MAIN)\n`;
        break;
      case 'show':
        code += `    ;; Show component\n`;
        code += `    (lv-obj-remove-flag ${target} LV_OBJ_FLAG_HIDDEN)\n`;
        break;
      case 'hide':
        code += `    ;; Hide component\n`;
        code += `    (lv-obj-add-flag ${target} LV_OBJ_FLAG_HIDDEN)\n`;
        break;
      case 'enable':
        code += `    ;; Enable component\n`;
        code += `    (lv-obj-remove-state ${target} LV_STATE_DISABLED)\n`;
        break;
      case 'disable':
        code += `    ;; Disable component\n`;
        code += `    (lv-obj-add-state ${target} LV_STATE_DISABLED)\n`;
        break;
      case 'setText':
        code += `    ;; Set text\n`;
        code += `    (lv-label-set-text ${target} "${value || ''}")\n`;
        break;
      case 'setValue':
        code += `    ;; Set value\n`;
        code += `    (lv-slider-set-value ${target} ${value || '0'} LV_ANIM_ON)\n`;
        break;
    }

    code += `    nil))\n`;

    return code;
  };

  const renderActionConfig = () => {
    switch (actionType) {
      case 'navigate':
        return (
          <div className="action-config">
            <div className="config-row">
              <label>{t('Target page')}</label>
              <select 
                value={targetPage} 
                onChange={(e) => setTargetPage(e.target.value)}
              >
                <option value="">{t('Select page...')}</option>
                {pages?.map(page => (
                  <option key={page.id} value={page.name}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="config-row">
              <label>{t('Animation')}</label>
              <select value={animation} onChange={(e) => setAnimation(e.target.value)}>
                {SCREEN_ANIMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            {animation !== 'none' && (
              <div className="config-row">
                <label>{t('Duration (ms)')}</label>
                <input type="number" min={0} value={duration} onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))} />
              </div>
            )}
          </div>
        );

      case 'setState':
      case 'setFlag':
        return (
          <div className="action-config">
            <div className="config-row">
              <label>{t('Target component')}</label>
              <select value={targetComponent} onChange={(e) => setTargetComponent(e.target.value)}>
                <option value="">{t('Select component...')}</option>
                {allComponents.map(comp => (
                  <option key={comp.id} value={comp.name}>{comp.name} ({comp.type})</option>
                ))}
              </select>
            </div>
            <div className="config-row">
              <label>{actionType === 'setState' ? t('State') : t('Flag')}</label>
              <select value={property} onChange={(e) => setProperty(e.target.value)}>
                <option value="">{t('Select...')}</option>
                {(actionType === 'setState' ? STATE_CHOICES : FLAG_CHOICES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="config-row">
              <label>{t('Mode')}</label>
              <select value={value || 'on'} onChange={(e) => setValue(e.target.value)}>
                <option value="on">{t('On')}</option>
                <option value="off">{t('Off')}</option>
                <option value="toggle">{t('Toggle')}</option>
              </select>
            </div>
          </div>
        );

      case 'setProperty':
        return (
          <div className="action-config">
            <div className="config-row">
              <label>{t('Target component')}</label>
              <select 
                value={targetComponent} 
                onChange={(e) => setTargetComponent(e.target.value)}
              >
                <option value="">{t('Select component...')}</option>
                {allComponents.map(comp => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="config-row">
              <label>{t('Property name')}</label>
              <select 
                value={property} 
                onChange={(e) => setProperty(e.target.value)}
              >
                <option value="">{t('Select property...')}</option>
                <option value="bg_color">{t('Background color (bg_color)')}</option>
                <option value="border_color">{t('Border color (border_color)')}</option>
                <option value="border_width">{t('Border width (border_width)')}</option>
                <option value="radius">{t('Radius (radius)')}</option>
                <option value="opa">{t('Opacity (opa)')}</option>
                <option value="x">{t('X coordinate (x)')}</option>
                <option value="y">{t('Y coordinate (y)')}</option>
                <option value="width">{t('Width (width)')}</option>
                <option value="height">{t('Height (height)')}</option>
                <option value="text_color">{t('Text color (text_color)')}</option>
                <option value="bg_opa">{t('Background opacity (bg_opa)')}</option>
                <option value="translate_x">{t('Translate X (translate_x)')}</option>
                <option value="translate_y">{t('Translate Y (translate_y)')}</option>
              </select>
            </div>
            <div className="config-row">
              <label>{t('Property value')}</label>
              <input 
                type="text" 
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('Enter property value')}
              />
            </div>
          </div>
        );

      case 'show':
      case 'hide':
      case 'enable':
      case 'disable':
        return (
          <div className="action-config">
            <div className="config-row">
              <label>{t('Target component')}</label>
              <select 
                value={targetComponent} 
                onChange={(e) => setTargetComponent(e.target.value)}
              >
                <option value="">{t('Select component...')}</option>
                {allComponents.map(comp => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'setText':
        return (
          <div className="action-config">
            <div className="config-row">
              <label>{t('Target component')}</label>
              <select 
                value={targetComponent} 
                onChange={(e) => setTargetComponent(e.target.value)}
              >
                <option value="">{t('Select component...')}</option>
                {allComponents.filter(c => ['label', 'btn', 'textarea'].includes(c.type)).map(comp => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="config-row">
              <label>{t('Text content')}</label>
              <input 
                type="text" 
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('Enter text')}
              />
            </div>
          </div>
        );

      case 'setValue':
        return (
          <div className="action-config">
            <div className="config-row">
              <label>{t('Target component')}</label>
              <select 
                value={targetComponent} 
                onChange={(e) => setTargetComponent(e.target.value)}
              >
                <option value="">{t('Select component...')}</option>
                {allComponents.filter(c => ['slider', 'bar', 'arc'].includes(c.type)).map(comp => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="config-row">
              <label>{t('Value')}</label>
              <input 
                type="number" 
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('Enter value')}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="event-dialog-overlay" onClick={onClose}>
      <div className="event-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{isCreating ? t('Add event') : t('Edit event')}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          {/* Event Type Selection */}
          <div className="form-section">
            <label className="section-label">{t('Event type')}</label>
            <select 
              value={eventType} 
              onChange={(e) => setEventType(e.target.value as LvglEventType)}
              className="event-type-select"
            >
              {LVGL_EVENTS.map(evt => (
                <option key={evt.type} value={evt.type}>
                  {evt.label} ({evt.type})
                </option>
              ))}
            </select>
            <p className="field-hint">
              {LVGL_EVENTS.find(e => e.type === eventType)?.description}
            </p>
          </div>

          {/* Handler Type Selection */}
          <div className="form-section">
            <label className="section-label">{t('Handler')}</label>
            <div className="handler-type-tabs">
              <button 
                className={`tab-btn ${handlerType === 'builtin' ? 'active' : ''}`}
                onClick={() => setHandlerType('builtin')}
              >
                {t('Built-in action')}
              </button>
              <button 
                className={`tab-btn ${handlerType === 'custom' ? 'active' : ''}`}
                onClick={() => setHandlerType('custom')}
              >
                {t('Custom code')}
              </button>
            </div>
          </div>

          {/* Handler Configuration */}
          {handlerType === 'builtin' ? (
            <div className="form-section">
              <label className="section-label">{t('Action type')}</label>
              <select 
                value={actionType} 
                onChange={(e) => setActionType(e.target.value as BuiltinActionType)}
                className="action-type-select"
              >
                {BUILTIN_ACTIONS.map(action => (
                  <option key={action.type} value={action.type}>
                    {action.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">
                {BUILTIN_ACTIONS.find(a => a.type === actionType)?.description}
              </p>
              
              {renderActionConfig()}
            </div>
          ) : (
            <div className="form-section">
              <label className="section-label">{t('Lisp code')}</label>
              <CodeEditor 
                value={customCode}
                onChange={setCustomCode}
                language="c"
              />
            </div>
          )}

          {/* Code Preview */}
          <div className="form-section">
            <div className="preview-header">
              <label className="section-label">{t('Code preview')}</label>
              <button 
                className="toggle-preview-btn"
                onClick={() => setShowCodePreview(!showCodePreview)}
              >
                {showCodePreview ? t('Hide') : t('Show')}
              </button>
            </div>
            {showCodePreview && (
              <pre className="code-preview">
                {generateCodePreview()}
              </pre>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-btn" onClick={onClose}>{t('Cancel')}</button>
          <button className="save-btn" onClick={handleSave}>{t('Save')}</button>
        </div>
      </div>
    </div>
  );
};

export default EventEditDialog;
