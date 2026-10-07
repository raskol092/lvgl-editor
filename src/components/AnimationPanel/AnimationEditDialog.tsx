import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Animation, AnimationType, AnimationEasing } from '../../types';
import { t } from '../../i18n';
import './AnimationPanel.css';

interface AnimationEditDialogProps {
  animation: Animation | null;
  isCreating: boolean;
  targetComponentId: string;
  onSave: (animation: Animation) => void;
  onClose: () => void;
}

const ANIMATION_TYPES: { type: AnimationType; label: string }[] = [
  { type: 'fade_in', label: t('Fade in') },
  { type: 'fade_out', label: t('Fade out') },
  { type: 'slide_left', label: t('Slide in from left') },
  { type: 'slide_right', label: t('Slide in from right') },
  { type: 'slide_up', label: t('Slide in from top') },
  { type: 'slide_down', label: t('Slide in from bottom') },
  { type: 'zoom_in', label: t('Zoom in') },
  { type: 'zoom_out', label: t('Zoom out') },
  { type: 'custom', label: t('Custom') },
];

const EASING_OPTIONS: { type: AnimationEasing; label: string }[] = [
  { type: 'linear', label: t('Linear') },
  { type: 'ease_in', label: t('Ease in') },
  { type: 'ease_out', label: t('Ease out') },
  { type: 'ease_in_out', label: t('Ease in-out') },
  { type: 'overshoot', label: t('Overshoot') },
  { type: 'bounce', label: t('Bounce') },
];

const PROPERTY_OPTIONS = [
  { value: 'opa', label: t('Opacity (opa)') },
  { value: 'x', label: t('X coordinate') },
  { value: 'y', label: t('Y coordinate') },
  { value: 'width', label: t('Width') },
  { value: 'height', label: t('Height') },
  { value: 'transform_zoom', label: t('Zoom (transform_zoom)') },
  { value: 'transform_angle', label: t('Rotation angle (transform_angle)') },
];

function getDefaultsForType(type: AnimationType): { property: string; startValue: number; endValue: number } {
  switch (type) {
    case 'fade_in': return { property: 'opa', startValue: 0, endValue: 255 };
    case 'fade_out': return { property: 'opa', startValue: 255, endValue: 0 };
    case 'slide_left': return { property: 'x', startValue: -100, endValue: 0 };
    case 'slide_right': return { property: 'x', startValue: 100, endValue: 0 };
    case 'slide_up': return { property: 'y', startValue: -100, endValue: 0 };
    case 'slide_down': return { property: 'y', startValue: 100, endValue: 0 };
    case 'zoom_in': return { property: 'transform_zoom', startValue: 128, endValue: 256 };
    case 'zoom_out': return { property: 'transform_zoom', startValue: 256, endValue: 128 };
    case 'custom': return { property: 'opa', startValue: 0, endValue: 255 };
  }
}

const AnimationEditDialog: React.FC<AnimationEditDialogProps> = ({
  animation,
  isCreating,
  targetComponentId,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(animation?.name || '');
  const [type, setType] = useState<AnimationType>(animation?.type || 'fade_in');
  const [easing, setEasing] = useState<AnimationEasing>(animation?.easing || 'ease_in_out');
  const [duration, setDuration] = useState(animation?.duration ?? 300);
  const [delay, setDelay] = useState(animation?.delay ?? 0);
  const [repeat, setRepeat] = useState(animation?.repeat ?? 0);
  const [property, setProperty] = useState(animation?.property || 'opa');
  const [startValue, setStartValue] = useState(animation?.startValue ?? 0);
  const [endValue, setEndValue] = useState(animation?.endValue ?? 255);

  const handleTypeChange = useCallback((newType: AnimationType) => {
    setType(newType);
    if (newType !== 'custom') {
      const defaults = getDefaultsForType(newType);
      setProperty(defaults.property);
      setStartValue(defaults.startValue);
      setEndValue(defaults.endValue);
    }
  }, []);

  const handleSave = useCallback(() => {
    const anim: Animation = {
      id: animation?.id || uuidv4(),
      name: name || ANIMATION_TYPES.find(t => t.type === type)?.label || type,
      targetComponentId,
      type,
      easing,
      duration,
      delay,
      repeat,
      property,
      startValue,
      endValue,
    };
    onSave(anim);
  }, [animation, name, targetComponentId, type, easing, duration, delay, repeat, property, startValue, endValue, onSave]);

  return (
    <div className="anim-dialog-overlay" onClick={onClose}>
      <div className="anim-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{isCreating ? t('Add animation') : t('Edit animation')}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          <div className="form-section">
            <label className="section-label">{t('Animation name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Optional; leave empty to use the default name')}
            />
          </div>

          <div className="form-section">
            <label className="section-label">{t('Animation type')}</label>
            <select value={type} onChange={(e) => handleTypeChange(e.target.value as AnimationType)}>
              {ANIMATION_TYPES.map(t => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label className="section-label">{t('Easing function')}</label>
            <select value={easing} onChange={(e) => setEasing(e.target.value as AnimationEasing)}>
              {EASING_OPTIONS.map(e => (
                <option key={e.type} value={e.type}>{e.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="section-label">{t('Duration (ms)')}</label>
              <input type="number" value={duration} min={0} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div className="form-section">
              <label className="section-label">{t('Delay (ms)')}</label>
              <input type="number" value={delay} min={0} onChange={(e) => setDelay(Number(e.target.value))} />
            </div>
            <div className="form-section">
              <label className="section-label">{t('Repeat count')}</label>
              <input type="number" value={repeat} min={0} onChange={(e) => setRepeat(Number(e.target.value))} />
              <p className="field-hint">{t('0 = no repeat')}</p>
            </div>
          </div>

          <div className="form-section">
            <label className="section-label">{t('Animated property')}</label>
            <select value={property} onChange={(e) => setProperty(e.target.value)}>
              {PROPERTY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="section-label">{t('Start value')}</label>
              <input type="number" value={startValue} onChange={(e) => setStartValue(Number(e.target.value))} />
            </div>
            <div className="form-section">
              <label className="section-label">{t('End value')}</label>
              <input type="number" value={endValue} onChange={(e) => setEndValue(Number(e.target.value))} />
            </div>
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

export default AnimationEditDialog;
