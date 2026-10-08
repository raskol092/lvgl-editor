import type { LvglComponent, StyleProps } from '../../../types';
import type { StyleState } from '../constants';

/** Everything the property sections need from PropertyEditor (selected component, style editing state, change handlers). */
export interface PropertyCtx {
  component: LvglComponent;
  definition: ReturnType<typeof import('../../../utils/componentDefinitions').getComponentDefinition>;
  currentStyles: StyleProps;
  handleStyleChange: (styleKey: keyof StyleProps, value: StyleProps[keyof StyleProps]) => void;
  handlePropertyChange: (property: keyof LvglComponent, value: LvglComponent[keyof LvglComponent]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlePropsChange: (propKey: string, value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleBatchPropsChange: (updates: Record<string, any>) => void;
  parentLayout: string | undefined;
  paddingLinked: boolean;
  setPaddingLinked: (v: boolean) => void;
  radiusLinked: boolean;
  setRadiusLinked: (v: boolean) => void;
  availableParts: readonly string[];
  activePart: string;
  setActivePart: (part: string) => void;
  activeState: StyleState;
  setActiveStyleState: (s: StyleState) => void;
  activeStyleState: string;
  hasStateOverride: boolean;
  handleClearStateOverride: () => void;
}
