import React, { useState, useEffect } from 'react';
import { t } from '../../../i18n';
import { useResourceStore } from '../../../resources/resourceStore';
import { useAppStore } from '../../../store/appStore';
import { useProjectStore } from '../../../store/projectStore';
import { BUILTIN_FONTS, BUILTIN_FONT_SIZES } from '../constants';
import type { StyleProps } from '../../../types';

// Font selector with resource store integration
export function FontSelector({
  currentStyles,
  handleStyleChange,
}: {
  currentStyles: StyleProps;
  handleStyleChange: (key: keyof StyleProps, value: StyleProps[keyof StyleProps]) => void;
}): React.ReactNode {
  const fonts = useResourceStore((s) => s.fonts);

  return (
    <div className="property-row">
      <label>{t('Font')}</label>
      <select
        value={currentStyles.textFont || ''}
        onChange={(e) => handleStyleChange('textFont', e.target.value || undefined)}
        style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
      >
        <option value="">{t('Default')}</option>
        <optgroup label={t('Built-in fonts')}>
          {BUILTIN_FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </optgroup>
        {fonts.length > 0 && (
          <optgroup label={t('Uploaded fonts')}>
            {fonts.map((f) => (
              <option key={f.id} value={f.cFontName}>{f.name} ({f.family})</option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

// Font selector for component props (fontResource + fontSize)
export function ComponentFontSelector({
  fontResource,
  fontSize,
  onChange,
  onBatchChange,
}: {
  fontResource?: string;
  fontSize?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBatchChange?: (updates: Record<string, any>) => void;
}): React.ReactNode {
  const fonts = useResourceStore((s) => s.fonts);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const getProjectConfig = useProjectStore((s) => s.getProjectConfig);
  const [projectDefaultFont, setProjectDefaultFont] = useState<string | undefined>();
  const [projectDefaultFontSize, setProjectDefaultFontSize] = useState<number | undefined>();

  useEffect(() => {
    if (!currentProjectId) return;
    getProjectConfig(currentProjectId).then(cfg => {
      if (cfg) {
        setProjectDefaultFont(cfg.lvglConfig.defaultFont);
        setProjectDefaultFontSize(cfg.lvglConfig.defaultFontSize);
      }
    });
  }, [currentProjectId, getProjectConfig]);

  // Determine current selection value
  const currentValue = fontResource || '';

  // Determine if the effective font is a builtin font (size selector should be hidden)
  const isBuiltinFont = (name: string) => /^montserrat_\d+$/.test(name);

  // Resolve the effective font: explicit selection or project default
  const effectiveFont = fontResource || projectDefaultFont || '';
  const effectiveIsBuiltin = isBuiltinFont(effectiveFont);

  // For custom fonts, show the full BUILTIN_FONT_SIZES list instead of FontResource.sizes
  const selectedCustomFont = fontResource
    ? fonts.find((f) => f.cFontName === fontResource)
    : undefined;
  const defaultCustomFont = !fontResource && projectDefaultFont
    ? fonts.find((f) => f.cFontName === projectDefaultFont)
    : undefined;
  const activeCustomFont = selectedCustomFont || defaultCustomFont;
  const availableSizes = activeCustomFont ? BUILTIN_FONT_SIZES : [];

  // When font changes, adjust fontSize if needed
  const handleFontChange = (value: string) => {
    if (!value) {
      // "Default" selected - clear fontResource; keep fontSize only if default is custom and size differs
      const defaultIsCustom = projectDefaultFont && !isBuiltinFont(projectDefaultFont);
      if (defaultIsCustom && fontSize !== undefined && fontSize !== (projectDefaultFontSize || 16)) {
        // Keep fontSize to indicate this component uses default font but at a different size
        if (onBatchChange) {
          onBatchChange({ fontResource: undefined, fontSize });
        } else {
          onChange('fontResource', undefined);
        }
      } else {
        // Clear both
        if (onBatchChange) {
          onBatchChange({ fontResource: undefined, fontSize: undefined });
        } else {
          onChange('fontResource', undefined);
          onChange('fontSize', undefined);
        }
      }
    } else {
      const customFont = fonts.find((f) => f.cFontName === value);
      if (customFont) {
        // Custom font: keep current fontSize if it's in BUILTIN_FONT_SIZES, otherwise pick closest
        const curSize = fontSize || 16;
        let newSize = curSize;
        if (!BUILTIN_FONT_SIZES.includes(curSize)) {
          newSize = BUILTIN_FONT_SIZES.reduce((a, b) =>
            Math.abs(b - curSize) < Math.abs(a - curSize) ? b : a
          );
        }
        if (onBatchChange) {
          onBatchChange({ fontResource: value, fontSize: newSize });
        } else {
          onChange('fontResource', value);
          onChange('fontSize', newSize);
        }
      } else {
        // Built-in font selected - set fontResource to builtin name, extract size
        const match = value.match(/^montserrat_(\d+)$/);
        if (match) {
          if (onBatchChange) {
            onBatchChange({ fontResource: value, fontSize: parseInt(match[1]) });
          } else {
            onChange('fontResource', value);
            onChange('fontSize', parseInt(match[1]));
          }
        }
      }
    }
  };

  // Show size selector only when the effective font is a custom font
  const showSizeSelector = !effectiveIsBuiltin && availableSizes.length > 0;

  return (
    <>
      <div className="property-row">
        <label>{t('Font')}</label>
        <select
          value={currentValue}
          onChange={(e) => handleFontChange(e.target.value)}
          style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
        >
          <option value="">{t('Default')}</option>
          <optgroup label={t('Built-in fonts')}>
            {BUILTIN_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </optgroup>
          {fonts.length > 0 && (
            <optgroup label={t('Uploaded fonts')}>
              {fonts.map((f) => (
                <option key={f.id} value={f.cFontName}>{f.name} ({f.family})</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      {showSizeSelector && (
        <div className="property-row">
          <label>{t('Font size')}</label>
          <select
            value={availableSizes.includes(fontSize || 14) ? (fontSize || 14) : 'custom'}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== 'custom') onChange('fontSize', parseInt(v));
            }}
            style={{ flex: 1, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
          >
            {availableSizes.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
            {!availableSizes.includes(fontSize || 14) && (
              <option value="custom">{fontSize || 14}{t('px (custom)')}</option>
            )}
          </select>
        </div>
      )}
    </>
  );
}
