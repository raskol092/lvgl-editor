import React from 'react';
import { t } from '../../i18n';
import './HelpPanel.css';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: t('Basic operations'),
    shortcuts: [
      { keys: 'Ctrl + Z', description: t('Undo') },
      { keys: 'Ctrl + Shift + Z', description: t('Redo') },
      { keys: 'Ctrl + Y', description: t('Redo') },
      { keys: 'Delete / Backspace', description: t('Delete selected components') },
      { keys: 'Escape', description: t('Deselect') },
    ],
  },
  {
    title: t('Selection'),
    shortcuts: [
      { keys: 'Ctrl + A', description: t('Select all') },
      { keys: 'Ctrl + Click', description: t('Multi-select / toggle selection') },
      { keys: t('Mouse drag'), description: t('Box-select multiple components') },
    ],
  },
  {
    title: t('Clipboard'),
    shortcuts: [
      { keys: 'Ctrl + C', description: t('Copy') },
      { keys: 'Ctrl + X', description: t('Cut') },
      { keys: 'Ctrl + V', description: t('Paste') },
      { keys: 'Ctrl + D', description: t('Duplicate (quick copy)') },
    ],
  },
  {
    title: t('Canvas operations'),
    shortcuts: [
      { keys: 'Space + ' + t('Drag'), description: t('Pan canvas') },
      { keys: t('Middle mouse drag'), description: t('Pan canvas') },
      { keys: 'Ctrl + ' + t('Scroll wheel'), description: t('Zoom canvas') },
    ],
  },
  {
    title: t('Other'),
    shortcuts: [
      { keys: 'F1 / ?', description: t('Show keyboard shortcuts help') },
      { keys: 'Ctrl + S', description: t('Save project') },
      { keys: 'Ctrl + O', description: t('Open project') },
      { keys: 'Ctrl + N', description: t('New project') },
    ],
  },
];

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="help-panel-overlay" onClick={onClose}>
      <div className="help-panel" onClick={e => e.stopPropagation()}>
        <div className="help-panel-header">
          <h2>{t('⌨️ Keyboard shortcuts')}</h2>
          <button className="help-panel-close" onClick={onClose}>×</button>
        </div>
        <div className="help-panel-content">
          {shortcutGroups.map((group, index) => (
            <div key={index} className="shortcut-group">
              <h3>{group.title}</h3>
              <div className="shortcut-list">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="shortcut-item">
                    <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                    <span className="shortcut-desc">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="help-panel-footer">
          <span>{t('Press Escape or click outside to close')}</span>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
