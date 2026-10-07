import Emoji from '../icons/Emoji';
import { tp } from '../../i18n/ti';
import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import type { ThemePreset } from '../../types';
import { t } from '../../i18n';
import './ThemeSelector.css';

const ThemeSelector: React.FC = () => {
  const { preset, setTheme, currentTheme } = useThemeStore();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemePreset);
  };

  return (
    <div className="theme-selector">
      <span className="theme-selector-icon"><Emoji c="🎨" /></span>
      <select
        className="theme-selector-select"
        value={preset}
        onChange={handleChange}
        title={t('Current theme: {0}', t(currentTheme.name))}
      >
        <option value="light">{tp('☀️ Light')}</option>
        <option value="dark">{tp('🌙 Dark')}</option>
      </select>
    </div>
  );
};

export default ThemeSelector;
