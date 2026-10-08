import Emoji from '../icons/Emoji';
import React, { useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { EventBinding, LvglEventType } from '../../types';
import EventEditDialog from './EventEditDialog';
import { t } from '../../i18n';
import './EventPanel.css';

// LVGL Event type definitions
// eslint-disable-next-line react-refresh/only-export-components
export const LVGL_EVENTS: { type: LvglEventType; label: string; description: string }[] = [
  { type: 'LV_EVENT_CLICKED', label: t('Click'), description: t('Triggered when the component is clicked') },
  { type: 'LV_EVENT_PRESSED', label: t('Press'), description: t('Triggered when the component is pressed') },
  { type: 'LV_EVENT_RELEASED', label: t('Release'), description: t('Triggered when the component is released') },
  { type: 'LV_EVENT_LONG_PRESSED', label: t('Long press'), description: t('Triggered when the component is long-pressed') },
  { type: 'LV_EVENT_VALUE_CHANGED', label: t('Value changed'), description: t('Triggered when the component value changes') },
  { type: 'LV_EVENT_FOCUSED', label: t('Focused'), description: t('Triggered when the component gains focus') },
  { type: 'LV_EVENT_DEFOCUSED', label: t('Defocused'), description: t('Triggered when the component loses focus') },
  { type: 'LV_EVENT_READY', label: t('Ready'), description: t('Triggered when the component is ready') },
  { type: 'LV_EVENT_CANCEL', label: t('Cancel'), description: t('Triggered when the operation is cancelled') },
  { type: 'LV_EVENT_PRESSING', label: t('Pressing'), description: t('Triggered continuously while the component is pressed') },
  { type: 'LV_EVENT_PRESS_LOST', label: t('Press lost'), description: t('Triggered when the pointer leaves the pressed component') },
  { type: 'LV_EVENT_SHORT_CLICKED', label: t('Short click'), description: t('Triggered on a click shorter than a long press') },
  { type: 'LV_EVENT_SINGLE_CLICKED', label: t('Single click'), description: t('Triggered on a click that is not followed by another one') },
  { type: 'LV_EVENT_DOUBLE_CLICKED', label: t('Double click'), description: t('Triggered on two quick clicks') },
  { type: 'LV_EVENT_TRIPLE_CLICKED', label: t('Triple click'), description: t('Triggered on three quick clicks') },
  { type: 'LV_EVENT_LONG_PRESSED_REPEAT', label: t('Long press repeat'), description: t('Triggered repeatedly while the component stays long-pressed') },
  { type: 'LV_EVENT_GESTURE', label: t('Gesture'), description: t('Triggered when a swipe gesture is detected') },
  { type: 'LV_EVENT_SCROLL_BEGIN', label: t('Scroll begin'), description: t('Triggered when scrolling starts') },
  { type: 'LV_EVENT_SCROLL', label: t('Scroll'), description: t('Triggered while the component scrolls') },
  { type: 'LV_EVENT_SCROLL_END', label: t('Scroll end'), description: t('Triggered when scrolling ends') },
  { type: 'LV_EVENT_KEY', label: t('Key'), description: t('Triggered when a key is sent to the component') },
  { type: 'LV_EVENT_INSERT', label: t('Text inserted'), description: t('Triggered when text is inserted into a text area') },
  { type: 'LV_EVENT_REFRESH', label: t('Refresh'), description: t('Triggered when the component should refresh itself') },
  { type: 'LV_EVENT_STATE_CHANGED', label: t('State changed'), description: t('Triggered when the state (checked, pressed, ...) changes') },
  { type: 'LV_EVENT_LEAVE', label: t('Leave'), description: t('Triggered when the component loses focus through a keypad or encoder') },
  { type: 'LV_EVENT_HOVER_OVER', label: t('Hover over'), description: t('Triggered when the pointer moves over the component') },
  { type: 'LV_EVENT_HOVER_LEAVE', label: t('Hover leave'), description: t('Triggered when the pointer leaves the component') },
  { type: 'LV_EVENT_SCREEN_LOAD_START', label: t('Screen load start'), description: t('Triggered when a screen starts loading (registered on the screen of this component)') },
  { type: 'LV_EVENT_SCREEN_LOADED', label: t('Screen loaded'), description: t('Triggered after a screen is loaded (registered on the screen of this component)') },
  { type: 'LV_EVENT_SCREEN_UNLOAD_START', label: t('Screen unload start'), description: t('Triggered when a screen starts unloading (registered on the screen of this component)') },
  { type: 'LV_EVENT_SCREEN_UNLOADED', label: t('Screen unloaded'), description: t('Triggered after a screen is unloaded (registered on the screen of this component)') },
];

const EventPanel: React.FC = () => {
  const { selection, getComponentById, updateComponent } = useEditorStore();
  const [editingEvent, setEditingEvent] = useState<EventBinding | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const selectedId = selection.selectedIds[0];
  const component = selectedId ? getComponentById(selectedId) : undefined;

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  }, []);

  const handleEditEvent = useCallback((event: EventBinding) => {
    setEditingEvent(event);
    setIsCreating(false);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteEvent = useCallback((eventId: string) => {
    if (!selectedId || !component) return;
    const newEvents = component.events.filter(e => e.id !== eventId);
    updateComponent(selectedId, { events: newEvents });
  }, [selectedId, component, updateComponent]);

  const handleSaveEvent = useCallback((event: EventBinding) => {
    if (!selectedId || !component) return;
    
    if (isCreating) {
      // Add new event
      updateComponent(selectedId, { 
        events: [...component.events, event] 
      });
    } else {
      // Update existing event
      const newEvents = component.events.map(e => 
        e.id === event.id ? event : e
      );
      updateComponent(selectedId, { events: newEvents });
    }
    
    setIsDialogOpen(false);
    setEditingEvent(null);
  }, [selectedId, component, updateComponent, isCreating]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingEvent(null);
  }, []);

  const getEventLabel = (eventType: LvglEventType): string => {
    const event = LVGL_EVENTS.find(e => e.type === eventType);
    return event?.label || eventType;
  };

  const getHandlerDescription = (event: EventBinding): string => {
    if (event.handlerType === 'custom') {
      return t('Custom code');
    }
    if (event.action) {
      switch (event.action.type) {
        case 'navigate':
          return `${t('Navigate to')}: ${event.action.targetPage || t('Not set')}`;
        case 'setProperty':
          return `${t('Set property')}: ${event.action.property || t('Not set')}`;
        case 'show':
          return `${t('Show')}: ${event.action.targetComponent || t('Not set')}`;
        case 'hide':
          return `${t('Hide')}: ${event.action.targetComponent || t('Not set')}`;
        case 'enable':
          return `${t('Enable')}: ${event.action.targetComponent || t('Not set')}`;
        case 'disable':
          return `${t('Disable')}: ${event.action.targetComponent || t('Not set')}`;
        case 'setText':
          return `${t('Set text')}: "${event.action.value || ''}"`;
        case 'setValue':
          return `${t('Set value')}: ${event.action.value ?? t('Not set')}`;
        default:
          return t('Built-in action');
      }
    }
    return t('Not configured');
  };

  if (!component) {
    return (
      <div className="event-panel">
        <div className="panel-header">
          <h3>{t('Events')}</h3>
        </div>
        <div className="no-selection">
          <p>{t('No component selected')}</p>
          <p className="hint">{t('Select a component to add events')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-panel">
      <div className="panel-header">
        <h3>{t('Events')}</h3>
        <button className="add-event-btn" onClick={handleAddEvent} title={t('Add event')}>
          <span>+</span>
        </button>
      </div>

      <div className="event-list">
        {component.events.length === 0 ? (
          <div className="no-events">
            <p>{t('No event bindings')}</p>
            <button className="add-first-event" onClick={handleAddEvent}>
              {t('+ Add event')}
            </button>
          </div>
        ) : (
          component.events.map(event => (
            <div key={event.id} className="event-item">
              <div className="event-info" onClick={() => handleEditEvent(event)}>
                <div className="event-type">
                  <span className="event-icon"><Emoji c="⚡" /></span>
                  {getEventLabel(event.eventType)}
                </div>
                <div className="event-handler">
                  {getHandlerDescription(event)}
                </div>
              </div>
              <div className="event-actions">
                <button 
                  className="event-edit-btn" 
                  onClick={() => handleEditEvent(event)}
                  title={t('Edit')}
                >
                  <Emoji c="✏" />
                </button>
                <button 
                  className="event-delete-btn" 
                  onClick={() => handleDeleteEvent(event.id)}
                  title={t('Delete')}
                >
                  <Emoji c="🗑" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isDialogOpen && (
        <EventEditDialog
          event={editingEvent}
          isCreating={isCreating}
          onSave={handleSaveEvent}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};

export default EventPanel;
