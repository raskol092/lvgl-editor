import { Sunrise, Sunset, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Emoji from '../icons/Emoji';
import { ti } from '../../i18n/ti';
import React, { useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { Animation, AnimationType } from '../../types';
import AnimationEditDialog from './AnimationEditDialog';
import { t } from '../../i18n';
import './AnimationPanel.css';

const ANIM_TYPE_LABELS: Record<AnimationType, string> = {
  fade_in: t('Fade in'),
  fade_out: t('Fade out'),
  slide_left: t('Slide in from left'),
  slide_right: t('Slide in from right'),
  slide_up: t('Slide in from top'),
  slide_down: t('Slide in from bottom'),
  zoom_in: t('Zoom in'),
  zoom_out: t('Zoom out'),
  custom: t('Custom'),
};

const ANIM_TYPE_ICONS: Record<AnimationType, LucideIcon> = {
  fade_in: Sunrise,
  fade_out: Sunset,
  slide_left: ArrowLeft,
  slide_right: ArrowRight,
  slide_up: ArrowUp,
  slide_down: ArrowDown,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,
  custom: Settings,
};

const AnimationPanel: React.FC = () => {
  const { selection, getComponentById, updateComponent } = useEditorStore();
  const [editingAnim, setEditingAnim] = useState<Animation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const selectedId = selection.selectedIds[0];
  const component = selectedId ? getComponentById(selectedId) : undefined;
  const animations = component?.animations || [];

  const handleAddAnim = useCallback(() => {
    setEditingAnim(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  }, []);

  const handleEditAnim = useCallback((anim: Animation) => {
    setEditingAnim(anim);
    setIsCreating(false);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteAnim = useCallback((animId: string) => {
    if (!selectedId || !component) return;
    const newAnims = animations.filter(a => a.id !== animId);
    updateComponent(selectedId, { animations: newAnims });
  }, [selectedId, component, animations, updateComponent]);

  const handleSaveAnim = useCallback((anim: Animation) => {
    if (!selectedId || !component) return;
    if (isCreating) {
      updateComponent(selectedId, { animations: [...animations, anim] });
    } else {
      updateComponent(selectedId, {
        animations: animations.map(a => a.id === anim.id ? anim : a),
      });
    }
    setIsDialogOpen(false);
  }, [selectedId, component, animations, isCreating, updateComponent]);

  if (!component) {
    return (
      <div className="animation-panel">
        <div className="panel-header">
          <h3>{ti('🎬 Animations')}</h3>
        </div>
        <div className="anim-no-selection">
          <p>{t('Select a component')}</p>
          <p className="hint">{t('Select a component to add animations')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animation-panel">
      <div className="panel-header">
        <h3>{ti('🎬 Animations')}</h3>
        <button className="add-anim-btn" onClick={handleAddAnim} title={t('Add animation')}>+</button>
      </div>
      <div className="anim-list">
        {animations.length === 0 ? (
          <div className="no-anims">
            <p>{t('No animations')}</p>
            <button className="add-first-anim" onClick={handleAddAnim}>
              {t('+ Add the first animation')}
            </button>
          </div>
        ) : (
          animations.map(anim => (
            <div key={anim.id} className="anim-item">
              <div className="anim-info" onClick={() => handleEditAnim(anim)}>
                <div className="anim-type">
                  <span className="anim-icon">{React.createElement(ANIM_TYPE_ICONS[anim.type] || Settings, { size: 16 })}</span>
                  {anim.name || ANIM_TYPE_LABELS[anim.type] || anim.type}
                </div>
                <div className="anim-detail">
                  {anim.duration}ms · {anim.easing} · {anim.property}: {anim.startValue}<Emoji c="→" />{anim.endValue}
                </div>
              </div>
              <div className="anim-actions">
                <button className="anim-edit-btn" onClick={() => handleEditAnim(anim)} title={t('Edit')}><Emoji c="✏" /></button>
                <button className="anim-delete-btn" onClick={() => handleDeleteAnim(anim.id)} title={t('Delete')}><Emoji c="🗑" /></button>
              </div>
            </div>
          ))
        )}
      </div>
      {isDialogOpen && (
        <AnimationEditDialog
          animation={editingAnim}
          isCreating={isCreating}
          targetComponentId={selectedId}
          onSave={handleSaveAnim}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default AnimationPanel;
