import React from 'react';
import { LANGS, getLang, setLang, t } from '../../i18n';
import type { Lang } from '../../i18n';
import './LanguageSwitcher.css';

const LanguageSwitcher: React.FC = () => (
  <div className="language-switcher">
    <span className="language-switcher-icon">🌐</span>
    <select
      className="language-switcher-select"
      value={getLang()}
      onChange={(e) => setLang(e.target.value as Lang)}
      title={t('Language')}
    >
      {LANGS.map((l) => (
        <option key={l.id} value={l.id}>{l.label}</option>
      ))}
    </select>
  </div>
);

export default LanguageSwitcher;
