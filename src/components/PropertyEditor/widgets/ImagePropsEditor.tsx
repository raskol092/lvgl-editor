import React, { useState } from 'react';
import Emoji from '../../icons/Emoji';
import { t } from '../../../i18n';
import { useResourceStore } from '../../../resources/resourceStore';

// Image props editor with resource picker
export function ImagePropsEditor({
  props,
  onChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (key: string, value: any) => void;
}): React.ReactNode {
  const images = useResourceStore((s) => s.images);
  const [showDropdown, setShowDropdown] = useState(false);

  // Find the currently selected resource image (match by id or name)
  const selectedImage = images.find(
    (img) => img.id === props.src || img.name === props.src
  );

  const handleSelectImage = (imageId: string) => {
    setShowDropdown(false);
    onChange('src', imageId);
  };

  const handleClear = () => {
    onChange('src', '');
    setShowDropdown(false);
  };

  return (
    <div className="property-section">
      <div className="section-header">{t('Image')}</div>
      <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
        <label>{t('Image source')}</label>
        <div className="image-src-picker">
          <div
            className="image-src-display"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {selectedImage ? (
              <>
                <img
                  src={selectedImage.data}
                  alt={selectedImage.name}
                  className="image-src-thumb"
                />
                <span className="image-src-name">{selectedImage.name}</span>
              </>
            ) : props.src ? (
              <span className="image-src-name" style={{ color: '#999' }}>{props.src}</span>
            ) : (
              <span className="image-src-placeholder">{t('Select an image resource...')}</span>
            )}
            <span className="image-src-arrow"><Emoji c="▼" /></span>
          </div>
          {showDropdown && (
            <div className="image-src-dropdown">
              {images.length === 0 ? (
                <div className="image-src-empty">{t('No image resources; upload one in the resource manager first')}</div>
              ) : (
                <>
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`image-src-option ${img.id === props.src ? 'selected' : ''}`}
                      onClick={() => handleSelectImage(img.id)}
                    >
                      <img src={img.data} alt={img.name} className="image-src-option-thumb" />
                      <div className="image-src-option-info">
                        <span className="image-src-option-name">{img.name}</span>
                        <span className="image-src-option-size">{img.width}×{img.height}</span>
                      </div>
                    </div>
                  ))}
                  {props.src && (
                    <div className="image-src-option clear-option" onClick={handleClear}>
                      {t('Clear selection')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <input
          type="text"
          value={props.src || ''}
          onChange={(e) => onChange('src', e.target.value)}
          placeholder={t('Or enter an image ID / URL manually')}
          style={{ fontSize: 11, color: '#888' }}
        />
      </div>
      <div className="property-row">
        <label>{t('Scale mode')}</label>
        <select
          value={props.scaleMode || 'none'}
          onChange={(e) => onChange('scaleMode', e.target.value)}
        >
          <option value="none">{t('Original')}</option>
          <option value="cover">{t('Cover')}</option>
          <option value="contain">{t('Contain')}</option>
        </select>
      </div>
      <div className="property-row">
        <label>{t('Rotation angle')}</label>
        <input
          type="number"
          value={props.rotation || 0}
          min={0}
          max={360}
          onChange={(e) => onChange('rotation', parseInt(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}
