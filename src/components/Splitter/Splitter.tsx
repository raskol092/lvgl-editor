import React from 'react';
import { t } from '../../i18n';
import './Splitter.css';

interface SplitterProps {
  /** `vertical` = a vertical bar that changes widths, `horizontal` = a horizontal bar that changes heights */
  orientation: 'vertical' | 'horizontal';
  onPointerDown: (e: React.PointerEvent) => void;
  onReset?: () => void;
}

const Splitter: React.FC<SplitterProps> = ({ orientation, onPointerDown, onReset }) => (
  <div
    className={`splitter splitter-${orientation}`}
    role="separator"
    aria-orientation={orientation}
    title={t('Drag to resize, double-click to reset')}
    onPointerDown={onPointerDown}
    onDoubleClick={onReset}
  />
);

export default Splitter;
