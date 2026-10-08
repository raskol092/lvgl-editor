import React from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';

// TabView tab manager component
export function TabManager({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const tabs: string[] = props.tabs || ['Tab 1', 'Tab 2'];
  const activeTab: number = props.activeTab || 0;
  const tabChildMap: Record<string, string[]> = props.tabChildMap || {};

  const setActiveTab = (index: number) => {
    onChange('activeTab', index);
  };

  const renameTab = (index: number, name: string) => {
    const newTabs = tabs.map((t, i) => i === index ? name : t);
    onChange('tabs', newTabs);
  };

  const addTab = () => {
    onChange('tabs', [...tabs, `Tab ${tabs.length + 1}`]);
  };

  const removeTab = (index: number) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter((_, i) => i !== index);
    // Update tabChildMap keys
    const newMap: Record<string, string[]> = {};
    for (let i = 0; i < newTabs.length; i++) {
      const oldIndex = i >= index ? i + 1 : i;
      if (tabChildMap[String(oldIndex)]) {
        newMap[String(i)] = tabChildMap[String(oldIndex)];
      }
    }
    onChange('tabs', newTabs);
    onChange('tabChildMap', newMap);
    if (activeTab >= newTabs.length) {
      onChange('activeTab', newTabs.length - 1);
    }
  };

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabs.length) return;
    const newTabs = [...tabs];
    [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
    // Swap child map entries
    const newMap = { ...tabChildMap };
    const a = newMap[String(index)];
    const b = newMap[String(targetIndex)];
    if (a || b) {
      newMap[String(index)] = b || [];
      newMap[String(targetIndex)] = a || [];
    }
    onChange('tabs', newTabs);
    onChange('tabChildMap', newMap);
    if (activeTab === index) onChange('activeTab', targetIndex);
    else if (activeTab === targetIndex) onChange('activeTab', index);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Tab view')}</div>
      <div className="tab-manager-list">
        {tabs.map((tab, i) => (
          <div
            key={i}
            className={`tab-manager-item ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            <input
              type="text"
              value={tab}
              onChange={(e) => renameTab(i, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="tab-manager-name-input"
            />
            <span className="tab-manager-child-count">
              {(tabChildMap[String(i)] || []).length} {t('components')}
            </span>
            <div className="tab-manager-actions">
              <button
                className="tab-manager-move-btn"
                onClick={(e) => { e.stopPropagation(); moveTab(i, 'up'); }}
                disabled={i === 0}
                title={t('Move up')}
              ><Emoji c="↑" /></button>
              <button
                className="tab-manager-move-btn"
                onClick={(e) => { e.stopPropagation(); moveTab(i, 'down'); }}
                disabled={i === tabs.length - 1}
                title={t('Move down')}
              ><Emoji c="↓" /></button>
              {tabs.length > 1 && (
                <button
                  className="tab-manager-delete-btn"
                  onClick={(e) => { e.stopPropagation(); removeTab(i); }}
                  title={t('Delete')}
                ><Emoji c="✕" /></button>
              )}
            </div>
          </div>
        ))}
        <button className="tab-manager-add-btn" onClick={addTab}>{t('+ Add tab')}</button>
      </div>
      <div className="property-row">
        <label>{t('Tab position')}</label>
        <select
          value={props.tabPosition || 'top'}
          onChange={(e) => onChange('tabPosition', e.target.value)}
        >
          <option value="top">{t('Top')}</option>
          <option value="bottom">{t('Bottom')}</option>
          <option value="left">{t('Left')}</option>
          <option value="right">{t('Right')}</option>
        </select>
      </div>
      <div className="tab-manager-hint">{t('Dropped components are assigned to the active tab automatically')}</div>
    </div>
  );
}
