import React from 'react';
import { t } from '../../../i18n';
import { GridTemplatePreview } from '../shared/GridTemplatePreview';

// Container layout properties editor
export function ContainerLayoutEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  return (
    <div className="property-section">
      <div className="section-header">{t('Container layout')}</div>
      <div className="property-row">
        <label>{t('Scroll direction')}</label>
        <select
          value={props.scrollDir || 'none'}
          onChange={(e) => onChange('scrollDir', e.target.value)}
        >
          <option value="none">{t('No scroll')}</option>
          <option value="hor">{t('Horizontal')}</option>
          <option value="ver">{t('Vertical')}</option>
          <option value="all">{t('All directions')}</option>
        </select>
      </div>
      <div className="property-row">
        <label>{t('Layout mode')}</label>
        <select
          value={props.layout || 'none'}
          onChange={(e) => onChange('layout', e.target.value)}
        >
          <option value="none">{t('None')}</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
        </select>
      </div>
      {props.layout === 'flex' && (
        <>
          <div className="property-row">
            <label>{t('Direction')}</label>
            <select
              value={props.flexDirection || 'row'}
              onChange={(e) => onChange('flexDirection', e.target.value)}
            >
              <option value="row">{t('Horizontal')}</option>
              <option value="column">{t('Vertical')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Spacing')}</label>
            <input
              type="number"
              value={props.gap || 0}
              min={0}
              onChange={(e) => onChange('gap', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="property-row">
            <label>{t('Wrap')}</label>
            <select
              value={props.flexWrap || 'nowrap'}
              onChange={(e) => onChange('flexWrap', e.target.value)}
            >
              <option value="nowrap">{t('No wrap')}</option>
              <option value="wrap">{t('Wrap')}</option>
              <option value="wrap-reverse">{t('Reverse wrap')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Main axis align')}</label>
            <select
              value={props.justifyContent || 'flex-start'}
              onChange={(e) => onChange('justifyContent', e.target.value)}
            >
              <option value="flex-start">{t('Start')}</option>
              <option value="flex-end">{t('End')}</option>
              <option value="center">{t('Center')}</option>
              <option value="space-between">{t('Space between')}</option>
              <option value="space-around">{t('Space around')}</option>
              <option value="space-evenly">{t('Space evenly')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Cross axis align')}</label>
            <select
              value={props.alignItems || 'flex-start'}
              onChange={(e) => onChange('alignItems', e.target.value)}
            >
              <option value="flex-start">{t('Start')}</option>
              <option value="flex-end">{t('End')}</option>
              <option value="center">{t('Center')}</option>
              <option value="stretch">{t('Stretch')}</option>
            </select>
          </div>
          <div className="property-row">
            <label>{t('Track align')}</label>
            <select
              value={props.alignContent || 'flex-start'}
              onChange={(e) => onChange('alignContent', e.target.value)}
            >
              <option value="flex-start">{t('Start')}</option>
              <option value="flex-end">{t('End')}</option>
              <option value="center">{t('Center')}</option>
              <option value="stretch">{t('Stretch')}</option>
              <option value="space-between">{t('Space between')}</option>
              <option value="space-around">{t('Space around')}</option>
            </select>
          </div>
        </>
      )}
      {props.layout === 'grid' && (
        <>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Column definitions')}</label>
            <input
              type="text"
              value={props.gridColumns || '1fr 1fr 1fr'}
              onChange={(e) => onChange('gridColumns', e.target.value)}
              placeholder={t('e.g. 1fr 2fr 1fr')}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <GridTemplatePreview value={props.gridColumns || '1fr 1fr 1fr'} />
          </div>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <label>{t('Row definitions')}</label>
            <input
              type="text"
              value={props.gridRows || '1fr 1fr'}
              onChange={(e) => onChange('gridRows', e.target.value)}
              placeholder={t('e.g. 1fr 2fr')}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <GridTemplatePreview value={props.gridRows || '1fr 1fr'} />
          </div>
          <div className="property-row two-col">
            <div className="property-field">
              <label>{t('Column gap')}</label>
              <input
                type="number"
                value={props.gridColumnGap || 0}
                min={0}
                onChange={(e) => onChange('gridColumnGap', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>{t('Line spacing')}</label>
              <input
                type="number"
                value={props.gridRowGap || 0}
                min={0}
                onChange={(e) => onChange('gridRowGap', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
