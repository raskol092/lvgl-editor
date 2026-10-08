import React, { useCallback, useState, useMemo } from 'react';
import { t } from '../../i18n';
import { useEditorStore } from '../../store/editorStore';
import { getComponentDefinition } from '../../utils/componentDefinitions';
import { PARTS_BY_TYPE } from '../../utils/styleKeys';
import BindingsEditor from './BindingsEditor';
import type { StyleState } from './constants';
import { AdvancedStyleSection } from './sections/AdvancedStyleSection';
import { AlignmentSection } from './sections/AlignmentSection';
import { BlendModeSection } from './sections/BlendModeSection';
import { BorderSideSection } from './sections/BorderSideSection';
import { ComponentInfoSection } from './sections/ComponentInfoSection';
import { FlexItemSection } from './sections/FlexItemSection';
import { GradientSection } from './sections/GradientSection';
import { GridItemSection } from './sections/GridItemSection';
import { OutlineSection } from './sections/OutlineSection';
import { PositionSizeSection } from './sections/PositionSizeSection';
import { ScrollbarSection } from './sections/ScrollbarSection';
import { ShadowSection } from './sections/ShadowSection';
import { StyleBasicSection } from './sections/StyleBasicSection';
import { TextFontSection } from './sections/TextFontSection';
import { TransformSection } from './sections/TransformSection';
import type { PropertyCtx } from './sections/types';
import { renderFlagsSection } from './shared/FlagsSection';
import { renderComponentProps } from './widgets/index';
import type { LvglComponent, StyleProps } from '../../types';
import './PropertyEditor.css';

const PropertyEditor: React.FC = () => {
  const { selection, getComponentById, updateComponent } = useEditorStore();
  const [activeState, setActiveStyleState] = useState<StyleState>('default');
  const [activePartRaw, setActivePart] = useState<string>('main');
  const [paddingLinked, setPaddingLinked] = useState(true);
  const [radiusLinked, setRadiusLinked] = useState(true);
  
  const selectedId = selection.selectedIds[0];
  const component = selectedId ? getComponentById(selectedId) : undefined;
  const definition = component ? getComponentDefinition(component.type) : undefined;

  // Look up parent component for flex/grid child properties
  const parentComponent = useMemo(() => {
    if (!component || !component.parentId) return undefined;
    return getComponentById(component.parentId);
  }, [component, getComponentById]);

  const parentLayout = parentComponent?.props?.layout as string | undefined;

  // part of the widget being styled (main or e.g. knob) and the key of the style in component.styles
  const availableParts = component ? (PARTS_BY_TYPE[component.type] || []) : [];
  const activePart = availableParts.includes(activePartRaw) ? activePartRaw : 'main';
  const activeStyleState: string = activePart === 'main' ? activeState : activeState === 'default' ? activePart : `${activePart}:${activeState}`;

  // Get the current style object for the active state
  const currentStyles: StyleProps = component
    ? (component.styles[activeStyleState] || (activePart === 'main' ? component.styles.default : {}))
    : {};

  // Whether the active state has its own overrides
  const hasStateOverride = component ? !!component.styles[activeStyleState] : false;

  const handlePropertyChange = useCallback(
    (property: keyof LvglComponent, value: LvglComponent[keyof LvglComponent]) => {
      if (!selectedId) return;
      updateComponent(selectedId, { [property]: value });
    },
    [selectedId, updateComponent]
  );

  const handleStyleChange = useCallback(
    (styleKey: keyof StyleProps, value: StyleProps[keyof StyleProps]) => {
      if (!selectedId || !component) return;
      const baseStyles = component.styles[activeStyleState] || (activePart === 'main' ? { ...component.styles.default } : {});
      updateComponent(selectedId, {
        styles: {
          ...component.styles,
          [activeStyleState]: {
            ...baseStyles,
            [styleKey]: value,
          },
        },
      });
    },
    [selectedId, component, updateComponent, activeStyleState]
  );

  const handleClearStateOverride = useCallback(() => {
    if (!selectedId || !component || activeStyleState === 'default') return;
    const newStyles = { ...component.styles };
    delete newStyles[activeStyleState];
    updateComponent(selectedId, { styles: newStyles });
  }, [selectedId, component, updateComponent, activeStyleState]);

  const handlePropsChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (propKey: string, value: any) => {
      if (!selectedId || !component) return;
      updateComponent(selectedId, {
        props: {
          ...component.props,
          [propKey]: value,
        },
      });
    },
    [selectedId, component, updateComponent]
  );

  const handleBatchPropsChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updates: Record<string, any>) => {
      if (!selectedId || !component) return;
      updateComponent(selectedId, {
        props: {
          ...component.props,
          ...updates,
        },
      });
    },
    [selectedId, component, updateComponent]
  );

  if (!component) {
    return (
      <div className="property-editor">
        <div className="panel-header">
          <h3>{t('Properties')}</h3>
        </div>
        <div className="no-selection">
          <p>{t('No component selected')}</p>
          <p className="hint">{t('Click a component on the canvas to edit it')}</p>
        </div>
      </div>
    );
  }

  const ctx: PropertyCtx = {
    component, definition, currentStyles, handleStyleChange, handlePropertyChange, handlePropsChange, handleBatchPropsChange,
    parentLayout, paddingLinked, setPaddingLinked, radiusLinked, setRadiusLinked, availableParts, activePart, setActivePart,
    activeState, setActiveStyleState, activeStyleState, hasStateOverride, handleClearStateOverride,
  };

  return (
    <div className="property-editor">
      <div className="panel-header">
        <h3>{t('Properties')}</h3>
      </div>
      
      <div
        className="property-sections"
        onClick={(e) => {
          // click on a section title folds / unfolds the section
          const header = (e.target as HTMLElement).closest('.section-header');
          if (header && header.parentElement?.classList.contains('property-section')) {
            header.parentElement.classList.toggle('collapsed');
          }
        }}
      >
        <ComponentInfoSection ctx={ctx} />

        <PositionSizeSection ctx={ctx} />

        <AlignmentSection ctx={ctx} />

        {/* Flags */}
        <div className="property-section">
          <div className="section-header">{t('Flags')}</div>
          {renderFlagsSection(component, handlePropertyChange)}
        </div>

        {/* Styles */}
        <div className="property-section">
          <div className="section-header">{t('Style')}</div>
          
          <StyleBasicSection ctx={ctx} />

          <BorderSideSection ctx={ctx} />

          <ShadowSection ctx={ctx} />

          <AdvancedStyleSection ctx={ctx} />

          <TransformSection ctx={ctx} />

          <ScrollbarSection ctx={ctx} />

          <TextFontSection ctx={ctx} />

          <GradientSection ctx={ctx} />

          <OutlineSection ctx={ctx} />

          <BlendModeSection ctx={ctx} />
        </div>

        {/* Component-specific props */}
        {renderComponentProps(component, handlePropsChange, handleBatchPropsChange)}
        <BindingsEditor component={component} onChange={(bindings) => handlePropertyChange('bindings', bindings)} />

        {/* Flex/Grid child properties */}
        <FlexItemSection ctx={ctx} />

        <GridItemSection ctx={ctx} />
      </div>
    </div>
  );
};


export default PropertyEditor;
