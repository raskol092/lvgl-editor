import React from 'react';

// Toggle switch UI component (Task 4.3)
export const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div className="toggle-switch-wrapper" onClick={() => onChange(!checked)}>
    {label && <span className="toggle-switch-label">{label}</span>}
    <div className={`toggle-switch ${checked ? 'on' : ''}`}>
      <div className="toggle-switch-knob" />
    </div>
  </div>
);
