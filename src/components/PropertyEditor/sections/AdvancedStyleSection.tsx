import React from 'react';
import { t } from '../../../i18n';
import type { PropertyCtx } from './types';
import { CollapsibleSection } from '../shared/CollapsibleSection';

export function AdvancedStyleSection({ ctx }: { ctx: PropertyCtx }): React.ReactElement {
  const { currentStyles, handleStyleChange } = ctx;
  return (
    <>
          {/* Advanced */}
          <CollapsibleSection title={t('Advanced')} defaultOpen={false}>
            {([
              ['minWidth', 'Min width'], ['maxWidth', 'Max width'], ['minHeight', 'Min height'], ['maxHeight', 'Max height'],
              ['marginTop', 'Margin top'], ['marginBottom', 'Margin bottom'], ['marginLeft', 'Margin left'], ['marginRight', 'Margin right'],
              ['padRow', 'Row gap'], ['padColumn', 'Column gap'],
              ['translateX', 'Translate X'], ['translateY', 'Translate Y'], ['skewX', 'Skew X'], ['skewY', 'Skew Y'],
              ['textOutlineWidth', 'Text outline width'],
              ['transformWidth', 'Grow width by'], ['transformHeight', 'Grow height by'], ['bgMainStop', 'Gradient start (0-255)'], ['blurRadius', 'Blur radius'],
            ] as Array<[string, string]>).map(([k, label]) => (
              <div className="property-row" key={k}>
                <label>{t(label)}</label>
                <input
                  type="number"
                  value={(currentStyles as Record<string, number | undefined>)[k] ?? 0}
                  onChange={(e) => handleStyleChange(k as never, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
            <div className="property-row">
              <label>{t('Text outline color')}</label>
              <input type="color" value={currentStyles.textOutlineColor || '#000000'} onChange={(e) => handleStyleChange('textOutlineColor' as never, e.target.value)} />
            </div>
            {([['bgOpa', 'Background opacity'], ['borderOpa', 'Border opacity'], ['outlineOpa', 'Outline opacity'], ['textOpa', 'Text opacity']] as Array<[string, string]>).map(([k, label]) => (
              <div className="property-row" key={k}>
                <label>{t(label)}</label>
                <input
                  type="range" min={0} max={255} step={1}
                  value={(currentStyles as Record<string, number | undefined>)[k] ?? 255}
                  onChange={(e) => handleStyleChange(k as never, parseInt(e.target.value))}
                />
                <span className="range-value">{(currentStyles as Record<string, number | undefined>)[k] ?? 255}</span>
              </div>
            ))}
            <div className="property-row">
              <label>{t('Border above content')}</label>
              <input type="checkbox" checked={currentStyles.borderPost === true} onChange={(e) => handleStyleChange('borderPost' as never, e.target.checked as never)} />
            </div>
            <div className="property-row">
              <label>{t('Clip corner')}</label>
              <input type="checkbox" checked={currentStyles.clipCorner === true} onChange={(e) => handleStyleChange('clipCorner' as never, e.target.checked as never)} />
            </div>
          </CollapsibleSection>
    </>
  );
}
