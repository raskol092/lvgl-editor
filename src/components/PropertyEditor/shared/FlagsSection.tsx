import React from 'react';
import { t } from '../../../i18n';
import { CONTAINER_TYPES, SCROLL_FLAGS } from '../constants';
import type { LvglComponent, LvglFlags } from '../../../types';

// Render flags section with grouped checkboxes
export function renderFlagsSection(
  component: LvglComponent,
  handlePropertyChange: (property: keyof LvglComponent, value: LvglComponent[keyof LvglComponent]) => void
): React.ReactNode {
  const flags = component.flags || {};
  const isContainer = CONTAINER_TYPES.has(component.type);

  const handleFlagChange = (flagKey: keyof LvglFlags, checked: boolean) => {
    handlePropertyChange('flags', { ...flags, [flagKey]: checked });
  };

  const FLAG_GROUPS: { label: string; items: { key: keyof LvglFlags; label: string }[] }[] = [
    {
      label: t('Interaction'),
      items: [
        { key: 'clickable', label: t('Clickable') },
        { key: 'checkable', label: t('Checkable') },
        { key: 'disabled', label: t('Disabled') },
      ],
    },
    {
      label: t('Scroll'),
      items: [
        { key: 'scrollable', label: t('Scrollable') },
        { key: 'scrollElastic', label: t('Elastic scroll') },
        { key: 'scrollMomentum', label: t('Momentum scroll') },
        { key: 'scrollOnFocus', label: t('Scroll on focus') },
        { key: 'scrollOne', label: t('Scroll one item') },
        { key: 'scrollChainHor', label: t('Chain horizontal scroll') },
        { key: 'scrollChainVer', label: t('Chain vertical scroll') },
        { key: 'scrollWithArrow', label: t('Scroll with arrow keys') },
      ],
    },
    {
      label: t('Behavior'),
      items: [
        { key: 'hidden', label: t('Hide') },
        { key: 'snappable', label: t('Snappable') },
        { key: 'pressLock', label: t('Press lock') },
        { key: 'eventBubble', label: t('Event bubble') },
        { key: 'gesturesBubble', label: t('Gesture bubble') },
        { key: 'eventTrickle', label: t('Event trickle') },
        { key: 'stateTrickle', label: t('State trickle') },
        { key: 'advHittest', label: t('Advanced hit test') },
        { key: 'floating', label: t('Floating') },
        { key: 'ignoreLayout', label: t('Ignore layout') },
        { key: 'overflowVisible', label: t('Overflow visible') },
        { key: 'flexInNewTrack', label: t('Flex: start new track') },
      ],
    },
  ];

  return (
    <>
      {FLAG_GROUPS.map((group) => {
        // Filter scroll flags for non-container types
        const items = isContainer ? group.items : group.items.filter(item => !SCROLL_FLAGS.has(item.key));
        if (items.length === 0) return null;
        return (
          <div key={group.label} className="flags-group">
            <div className="flags-group-label">{group.label}</div>
            {items.map((item) => (
              <div key={item.key} className="flag-row">
                <input
                  type="checkbox"
                  id={`flag-${item.key}`}
                  checked={!!flags[item.key]}
                  onChange={(e) => handleFlagChange(item.key, e.target.checked)}
                />
                <label htmlFor={`flag-${item.key}`}>{item.label}</label>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
