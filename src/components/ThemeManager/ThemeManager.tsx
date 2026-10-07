import React, { useState } from 'react';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import { builtinThemes, useThemeStore } from '../../store/themeStore';
import type { Theme, ThemeColors } from '../../types';
import { modal } from '../Modal';
import { t } from '../../i18n';
import './ThemeManager.css';

const COLOR_FIELDS: Array<{ key: keyof ThemeColors; label: string }> = [
  { key: 'primary', label: 'Primary color' },
  { key: 'secondary', label: 'Secondary color' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'border', label: 'Border' },
];

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

/** Text field that keeps a draft while typing and commits only a complete #rrggbb value */
const HexInput: React.FC<{ value: string; disabled: boolean; onCommit: (v: string) => void }> = ({ value, disabled, onCommit }) => {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="text"
      className="tm-hex"
      disabled={disabled}
      value={draft ?? value}
      onChange={e => { setDraft(e.target.value); if (isHex(e.target.value)) onCommit(e.target.value); }}
      onBlur={() => setDraft(null)}
    />
  );
};

const Preview: React.FC<{ colors: ThemeColors }> = ({ colors }) => (
  <div className="tm-preview" style={{ background: colors.background, borderColor: colors.border }}>
    <div className="tm-preview-card" style={{ background: colors.surface, borderColor: colors.border, color: colors.text }}>
      <span>{t('Preview')}</span>
      <span className="tm-preview-btn" style={{ background: colors.primary }}>OK</span>
      <span className="tm-preview-btn" style={{ background: colors.secondary }}>+</span>
    </div>
  </div>
);

const ThemeManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentTheme, customThemes, setTheme, createCustomTheme, updateCustomTheme, deleteCustomTheme } = useThemeStore();
  const [selectedId, setSelectedId] = useState(currentTheme.id);

  const all: Theme[] = [...builtinThemes, ...customThemes];
  const selected = all.find(x => x.id === selectedId) ?? currentTheme;
  const isCustom = customThemes.some(x => x.id === selected.id);

  const apply = (theme: Theme) => {
    if (theme.id === 'light' || theme.id === 'dark') setTheme(theme.id);
    else setTheme('custom', theme.id);
  };

  const create = (base: Theme, name: string) => {
    const theme = createCustomTheme(name, { ...base.colors });
    setSelectedId(theme.id);
    apply(theme);
  };

  const nameOf = (theme: Theme) => (customThemes.some(x => x.id === theme.id) ? theme.name : t(theme.name));

  const remove = async () => {
    if (await modal.confirm(t('Delete theme "{0}"?', selected.name))) {
      deleteCustomTheme(selected.id);
      setSelectedId('light');
    }
  };

  return (
    <div className="modal-global-overlay" onClick={onClose}>
      <div className="modal-dialog tm-dialog" onClick={e => e.stopPropagation()}>
        <div className="tm-title">{t('Themes')}</div>
        <div className="tm-body">
          <div className="tm-list">
            {all.map(theme => (
              <button
                key={theme.id}
                className={`tm-item ${theme.id === selected.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(theme.id)}
                onDoubleClick={() => apply(theme)}
              >
                <span className="tm-swatches">
                  {[theme.colors.background, theme.colors.surface, theme.colors.primary, theme.colors.secondary].map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                <span className="tm-item-name">{nameOf(theme)}</span>
                {theme.id === currentTheme.id && <Check size={14} className="tm-active" />}
              </button>
            ))}
            <button className="tm-item tm-new" onClick={() => create(selected, t('Custom theme {0}', customThemes.length + 1))}>
              <Plus size={14} /> {t('New theme')}
            </button>
          </div>

          <div className="tm-edit">
            <Preview colors={selected.colors} />
            {isCustom ? (
              <label className="tm-field">
                <span>{t('Name')}</span>
                <input type="text" value={selected.name} onChange={e => updateCustomTheme(selected.id, { name: e.target.value })} />
              </label>
            ) : (
              <div className="tm-hint">{t('Built-in themes cannot be edited. Duplicate it to make your own.')}</div>
            )}
            {COLOR_FIELDS.map(({ key, label }) => (
              <label className="tm-field" key={key}>
                <span>{t(label)}</span>
                <input
                  type="color"
                  disabled={!isCustom}
                  value={isHex(selected.colors[key]) ? selected.colors[key] : '#000000'}
                  onChange={e => updateCustomTheme(selected.id, { colors: { [key]: e.target.value } })}
                />
                <HexInput
                  disabled={!isCustom}
                  value={selected.colors[key]}
                  onCommit={v => updateCustomTheme(selected.id, { colors: { [key]: v } })}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="tm-footer">
          {isCustom && (
            <button className="tm-btn danger" onClick={remove}><Trash2 size={14} /> {t('Delete')}</button>
          )}
          <button className="tm-btn" onClick={() => create(selected, t('{0} copy', nameOf(selected)))}><Copy size={14} /> {t('Duplicate')}</button>
          <span style={{ flex: 1 }} />
          <button className="tm-btn primary" disabled={selected.id === currentTheme.id} onClick={() => apply(selected)}>
            {selected.id === currentTheme.id ? t('Current theme') : t('Apply')}
          </button>
          <button className="tm-btn" onClick={onClose}>{t('Close')}</button>
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;
