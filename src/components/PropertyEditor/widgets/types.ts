import type { LvglComponent } from '../../../types';

export interface WidgetEditorProps {
  component: LvglComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBatchChange?: (updates: Record<string, any>) => void;
}
