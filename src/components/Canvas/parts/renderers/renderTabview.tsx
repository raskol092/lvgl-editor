import React from 'react';
import type { RenderCtx } from '../types';

export function renderTabview(ctx: RenderCtx): React.ReactNode {
  const { component, props, th, tint, muted, children, updateComponent } = ctx;
        return (
          <div className="lvgl-tabview" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              borderBottom: `2px solid ${th.border}`,
              backgroundColor: tint,
              flexShrink: 0,
            }}>
              {(props.tabs || ['Tab 1', 'Tab 2']).map((tab: string, i: number) => (
                <div key={i} style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderBottom: i === (props.activeTab || 0) ? `2px solid ${th.primary}` : '2px solid transparent',
                  color: i === (props.activeTab || 0) ? th.primary : muted,
                  fontWeight: i === (props.activeTab || 0) ? 600 : 400,
                  marginBottom: '-2px',
                }} onClick={(e) => {
                  e.stopPropagation();
                  updateComponent(component.id, { props: { ...props, activeTab: i } });
                }}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="lvgl-tabview-content" style={{ flex: 1, padding: '8px' }}>{children}</div>
          </div>
        );
}
