import React from 'react';
import { ExtraWidgetEditor, MoreWidgetProps } from '../extraEditors';
import { ArcEditor } from './ArcEditor';
import { BarEditor } from './BarEditor';
import { ButtonEditor } from './ButtonEditor';
import { CalendarEditor } from './CalendarEditor';
import { ChartSeriesEditor } from './ChartSeriesEditor';
import { CheckboxEditor } from './CheckboxEditor';
import { ContainerLayoutEditor } from './ContainerLayoutEditor';
import { DropdownEditor } from './DropdownEditor';
import { ImagePropsEditor } from './ImagePropsEditor';
import { LabelEditor } from './LabelEditor';
import { LedEditor } from './LedEditor';
import { LineEditor } from './LineEditor';
import { SliderEditor } from './SliderEditor';
import { SpinnerEditor } from './SpinnerEditor';
import { SwitchEditor } from './SwitchEditor';
import { TabManager } from './TabManager';
import { TableEditor } from './TableEditor';
import { TextareaEditor } from './TextareaEditor';
import { TileGridEditor } from './TileGridEditor';
import { WindowEditor } from './WindowEditor';
import type { LvglComponent } from '../../../types';

export function renderComponentProps(
  component: LvglComponent,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBatchChange?: (updates: Record<string, any>) => void
): React.ReactNode {
  const { type, props } = component;
  const common = { component, onChange, onBatchChange };
  let editor: React.ReactNode;
  switch (type) {
    case 'btn':
      editor = <ButtonEditor {...common} />;
      break;
    case 'label':
      editor = <LabelEditor {...common} />;
      break;
    case 'textarea':
      editor = <TextareaEditor {...common} />;
      break;
    case 'checkbox':
      editor = <CheckboxEditor {...common} />;
      break;
    case 'switch':
      editor = <SwitchEditor {...common} />;
      break;
    case 'slider':
      editor = <SliderEditor {...common} />;
      break;
    case 'led':
      editor = <LedEditor {...common} />;
      break;
    case 'bar':
      editor = <BarEditor {...common} />;
      break;
    case 'dropdown':
      editor = <DropdownEditor {...common} />;
      break;
    case 'arc':
      editor = <ArcEditor {...common} />;
      break;
    case 'spinner':
      editor = <SpinnerEditor {...common} />;
      break;
    case 'win':
      editor = <WindowEditor props={props} onChange={onChange} />;
      break;
    case 'table':
      editor = <TableEditor props={props} onChange={onChange} />;
      break;
    case 'img':
      editor = <ImagePropsEditor props={props} onChange={onChange} />;
      break;
    case 'line':
      editor = <LineEditor props={props} onChange={onChange} />;
      break;
    case 'chart':
      editor = <ChartSeriesEditor props={props} onChange={onChange} />;
      break;
    case 'calendar':
      editor = <CalendarEditor props={props} onChange={onChange} />;
      break;
    case 'tabview':
      editor = <TabManager props={props} onChange={onChange} />;
      break;
    case 'tileview':
      editor = <TileGridEditor props={props} onChange={onChange} />;
      break;
    case 'obj':
      editor = <ContainerLayoutEditor props={props} onChange={onChange} />;
      break;
    default:
      editor = <ExtraWidgetEditor type={type} props={props} onChange={onChange} />;
  }
  return (
    <>
      {editor}
      <MoreWidgetProps type={type} props={props} onChange={onChange} />
    </>
  );
}
