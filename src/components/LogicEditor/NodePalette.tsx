import { ChevronDown, ChevronRight } from 'lucide-react';
import Emoji from '../icons/Emoji';
// Node Palette - Drag nodes from here to the canvas

import React, { useState, useCallback } from 'react';
import { NODE_CATEGORIES, getNodesByCategory, NODE_DEFINITIONS } from './nodeDefinitions';
import type { LogicNodeDefinition } from './types';
import { t } from '../../i18n';
import ToolIcon from '../icons/ToolIcon';
import './NodePalette.css';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeDefinition: LogicNodeDefinition) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    trigger: true,
    condition: true,
    action: true,
    data: true,
    custom: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hovered, setHovered] = useState<LogicNodeDefinition | null>(null);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent, definition: LogicNodeDefinition) => {
      event.dataTransfer.setData('application/json', JSON.stringify(definition));
      event.dataTransfer.effectAllowed = 'copy';
      onDragStart(event, definition);
    },
    [onDragStart]
  );

  // Filter nodes by search query
  const filteredDefinitions = searchQuery
    ? NODE_DEFINITIONS.filter(
        def =>
          def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          def.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>{t('Nodes')}</h3>
      </div>

      {/* Search */}
      <div className="palette-search">
        <input
          type="text"
          placeholder={t('Search nodes...')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <Emoji c="✕" />
          </button>
        )}
      </div>

      {/* Node List */}
      <div className="palette-content">
        {searchQuery && filteredDefinitions ? (
          // Search results
          <div className="search-results">
            {filteredDefinitions.length === 0 ? (
              <div className="no-results">{t('No matching nodes found')}</div>
            ) : (
              filteredDefinitions.map(def => (
                <NodeItem
                  key={def.subType}
                  definition={def}
                  onDragStart={handleDragStart}
                  onHover={setHovered}
                />
              ))
            )}
          </div>
        ) : (
          // Category view
          NODE_CATEGORIES.map(category => (
            <div key={category.id} className="palette-category">
              <div
                className="category-header"
                onClick={() => toggleCategory(category.id)}
              >
                <span className="category-icon"><ToolIcon name={`cat:${category.id}`} size={14} fallback={category.icon} /></span>
                <span className="category-name">{t(category.name)}</span>
                <span className="category-toggle">
                  {expandedCategories[category.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
              </div>
              {expandedCategories[category.id] && (
                <div className="category-nodes">
                  {getNodesByCategory(category.id).map(def => (
                    <NodeItem
                      key={def.subType}
                      definition={def}
                      onDragStart={handleDragStart}
                      onHover={setHovered}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="panel-hint">
        {hovered ? (
          <>
            <strong>{hovered.label}</strong>
            <span>{hovered.description}</span>
          </>
        ) : (
          t('Drag & drop to add')
        )}
      </div>
    </div>
  );
};

// Individual node item
interface NodeItemProps {
  definition: LogicNodeDefinition;
  onDragStart: (event: React.DragEvent, definition: LogicNodeDefinition) => void;
  onHover: (definition: LogicNodeDefinition | null) => void;
}

const NodeItem: React.FC<NodeItemProps> = ({ definition, onDragStart, onHover }) => {
  return (
    <div
      className="node-item"
      draggable
      onDragStart={e => onDragStart(e, definition)}
      style={{ '--node-color': definition.color } as React.CSSProperties}
      onMouseEnter={() => onHover(definition)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="node-icon"><ToolIcon name={definition.subType === 'switch' ? 'switch_node' : definition.subType} size={22} fallback={definition.icon} /></span>
      <div className="node-info">
        <span className="node-label">{definition.label}</span>
      </div>
    </div>
  );
};

export default NodePalette;
