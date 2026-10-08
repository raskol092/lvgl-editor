import React from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';

// Dropdown options list editor (Task 3)
export const DropdownOptionsEditor: React.FC<{
  options: string[];
  onChange: (options: string[]) => void;
}> = ({ options, onChange }) => {
  const handleTextChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    onChange(newOptions);
  };

  const handleMoveDown = (index: number) => {
    if (index >= options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    onChange(newOptions);
  };

  const handleDelete = (index: number) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...options, `${t('Option')} ${options.length + 1}`]);
  };

  return (
    <div className="dropdown-options-editor">
      {options.map((opt, i) => (
        <div key={i} className="dropdown-option-row">
          <span className="dropdown-option-index">{i + 1}</span>
          <input
            type="text"
            className="dropdown-option-input"
            value={opt}
            onChange={(e) => handleTextChange(i, e.target.value)}
          />
          <button
            className="dropdown-option-btn"
            onClick={() => handleMoveUp(i)}
            disabled={i === 0}
            title={t('Move up')}
          ><Emoji c="↑" /></button>
          <button
            className="dropdown-option-btn"
            onClick={() => handleMoveDown(i)}
            disabled={i === options.length - 1}
            title={t('Move down')}
          ><Emoji c="↓" /></button>
          <button
            className="dropdown-option-btn delete"
            onClick={() => handleDelete(i)}
            disabled={options.length <= 1}
            title={t('Delete')}
          ><Emoji c="✕" /></button>
        </div>
      ))}
      <button className="dropdown-option-add" onClick={handleAdd}>{t('+ Add option')}</button>
    </div>
  );
};
