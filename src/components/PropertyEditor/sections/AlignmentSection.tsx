import React from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';
import { ALIGN_OPTIONS } from '../constants';
import type { PropertyCtx } from './types';

export function AlignmentSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { component, handlePropertyChange } = ctx;
  return (
    <>
        {/* Alignment */}
        <div className="property-section">
          <div className="section-header">{t('Align')}</div>
          <div className="align-grid">
            {ALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`align-grid-btn ${(component.align || 'default') === opt.value ? 'active' : ''}`}
                style={{ gridRow: opt.row + 1, gridColumn: opt.col + 1 }}
                onClick={() => handlePropertyChange('align', opt.value)}
                title={opt.value}
              >
                <Emoji c={opt.label} />
              </button>
            ))}
          </div>
          <div className="property-row" style={{ marginTop: 8 }}>
            <label>{t('Align')}</label>
            <select
              value={component.align || 'default'}
              onChange={(e) => handlePropertyChange('align', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
            >
              <option value="default">{t('Default')}</option>
              <option value="center">{t('Center')}</option>
              <option value="top_left">{t('Top left')}</option>
              <option value="top_mid">{t('Top middle')}</option>
              <option value="top_right">{t('Top right')}</option>
              <option value="left_mid">{t('Left middle')}</option>
              <option value="right_mid">{t('Right middle')}</option>
              <option value="bottom_left">{t('Bottom left')}</option>
              <option value="bottom_mid">{t('Bottom middle')}</option>
              <option value="bottom_right">{t('Bottom right')}</option>
            </select>
          </div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Offset X')}</label>
              <input
                type="number"
                value={component.alignOffsetX || 0}
                onChange={(e) => handlePropertyChange('alignOffsetX', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>{t('Offset Y')}</label>
              <input
                type="number"
                value={component.alignOffsetY || 0}
                onChange={(e) => handlePropertyChange('alignOffsetY', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
    </>
  );
}
