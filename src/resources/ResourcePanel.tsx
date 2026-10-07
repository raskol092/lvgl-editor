import Emoji from '../components/icons/Emoji';
import { ti } from '../i18n/ti';
// Resource Panel - Main resource management component

import React from 'react';
import { useResourceStore } from './resourceStore';
import { useEditorStore } from '../store/editorStore';
import ImageManager from './ImageManager';
import FontManager from './FontManager';
import IconLibrary from './IconLibrary';
import { t } from '../i18n';
import './ResourcePanel.css';

const ResourcePanel: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    images,
    fonts,
  } = useResourceStore();
  
  const pickTarget = useResourceStore(s => s.pickTarget);
  const setPickTarget = useResourceStore(s => s.setPickTarget);
  const selected = useEditorStore(s => s.selection.selectedIds);
  const targetComp = useEditorStore(s => (pickTarget ? s.getComponentById(pickTarget) : undefined));
  const picking = !!targetComp && selected.length === 1 && selected[0] === pickTarget;

  const tabs = [
    { id: 'images' as const, label: t('Image'), icon: '🖼️', count: images.length },
    { id: 'fonts' as const, label: t('Font'), icon: '🔤', count: fonts.length },
    { id: 'icons' as const, label: t('Icons'), icon: '⭐', count: 0 },
  ];
  
  return (
    <div className="resource-panel">
      {/* Header */}
      <div className="resource-header">
        <h3>{ti('📦 Resource manager')}</h3>
        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title={t('Grid view')}
          >
            <Emoji c="▦" />
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title={t('List view')}
          >
            <Emoji c="☰" />
          </button>
        </div>
      </div>
      
      {picking && (
        <div className="resource-pick-banner">
          <span>{t('Choose an image for "{0}"', targetComp!.name)}</span>
          <button onClick={() => setPickTarget(null)}>{t('Cancel')}</button>
        </div>
      )}

      {/* Tabs */}
      <div className="resource-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon"><Emoji c={tab.icon} /></span>
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Search */}
      <div className="resource-search">
        <input
          type="text"
          placeholder={t('Search resources...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => setSearchQuery('')}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="resource-content">
        {activeTab === 'images' && <ImageManager viewMode={viewMode} />}
        {activeTab === 'fonts' && <FontManager viewMode={viewMode} />}
        {activeTab === 'icons' && <IconLibrary viewMode={viewMode} />}
      </div>
    </div>
  );
};

export default ResourcePanel;
