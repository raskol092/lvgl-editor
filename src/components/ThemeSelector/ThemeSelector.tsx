import Emoji from '../icons/Emoji';
import { tp } from '../../i18n/ti';
import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import type { ThemePreset } from '../../types';
import { t } from '../../i18n';
import { useUiThemeStore, type UiThemeMode } from '../../store/uiThemeStore';
import './ThemeSelector.css';

/** Editor appearance: system / light / dark */
export const UiThemeSelect: React.FC = () => {
  const { mode, setMode } = useUiThemeStore();
  return (
    <span className="theme-selector">
      <span className="theme-selector-icon"><Emoji c="🌙" /></span>
      <select
        className="theme-selector-select"
        value={mode}
        onChange={e => setMode(e.target.value as UiThemeMode)}
        title={t('Editor appearance')}
      >
        <option value="system">{t('System')}</option>
        <option value="light">{t('Light')}</option>
        <option value="dark">{t('Dark')}</option>
      </select>
    </span>
  );
};

const ThemeSelector: React.FC = () => {
  const { preset, setTheme, currentTheme } = useThemeStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemePreset);
  };

  return (
    <div className="theme-selector">
      <UiThemeSelect />
      <span className="theme-selector-icon"><Emoji c="🎨" /></span>
      <select
        className="theme-selector-select"
        value={preset}
        onChange={handleChange}
        title={t('Generated UI theme: {0}', t(currentTheme.name))}
      >
        <option value="light">{tp('☀️ Light')}</option>
        <option value="dark">{tp('🌙 Dark')}</option>
      </select>
    </div>
  );
};

export default ThemeSelector;
