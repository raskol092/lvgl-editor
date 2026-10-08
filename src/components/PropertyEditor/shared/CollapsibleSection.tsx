import React, { useState } from 'react';
import Emoji from '../../icons/Emoji';

// Inline CollapsibleSection component
export const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <span className={`collapsible-arrow ${open ? 'open' : ''}`}><Emoji c="▶" /></span>
        <span>{title}</span>
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
};
