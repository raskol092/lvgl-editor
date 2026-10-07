import Emoji from '../components/icons/Emoji';
import { ti } from '../i18n/ti';
// Image Manager Component

import React, { useState, useRef } from 'react';
import { useResourceStore } from './resourceStore';
import type { ImageFormat } from './types';
import { toast } from '../components/Toast';
import { modal } from '../components/Modal';
import { t } from '../i18n';
import DraggableResource from './DraggableResource';
import { chooseImage } from './chooseImage';
import './ImageManager.css';

interface ImageManagerProps {
  viewMode: 'grid' | 'list';
}

const ImageManager: React.FC<ImageManagerProps> = ({ viewMode }) => {
  const {
    getFilteredImages,
    addImage,
    deleteImage,
    updateImage,
    selectedResourceId,
    setSelectedResource,
  } = useResourceStore();
  
  const images = getFilteredImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }
        await addImage(file);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(t('Failed to upload image'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await modal.confirm(t('Delete this image?'))) {
      deleteImage(id);
    }
  };
  
  
  
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const selectedImage = images.find(img => img.id === selectedResourceId);
  
  return (
    <div className="image-manager">
      {/* Toolbar */}
      <div className="resource-toolbar">
        <button 
          className="upload-btn"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? t('Uploading...') : ti('📤 Upload image')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/bmp,image/gif"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      
      {/* Image List/Grid */}
      <div className={`image-list ${viewMode}`}>
        {images.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><Emoji c="🖼" /></span>
            <p>{t('No image resources')}</p>
            <p className="empty-hint">{t('Click the button above to upload an image')}</p>
          </div>
        ) : (
          images.map(image => (
            <DraggableResource
              key={image.id}
              dragId={`image-${image.id}`}
              dragData={{ type: 'new-image', imageId: image.id, width: image.width, height: image.height }}
              className={`image-item ${selectedResourceId === image.id ? 'selected' : ''}`}
              onClick={() => { setSelectedResource(image.id); chooseImage(image.id, image.width, image.height); }}
              title={t('Click to use, or drag onto the canvas')}
            >
              <div className="image-preview">
                <img src={image.data} alt={image.name} />
              </div>
              <div className="image-info">
                <span className="image-name" title={image.name}>{image.name}</span>
                <span className="image-size">{image.width}×{image.height}</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(image.id, e)}
                title={t('Delete')}
              >
                <Emoji c="🗑" />
              </button>
            </DraggableResource>
          ))
        )}
      </div>
      
      {/* Selected Image Details */}
      {selectedImage && (
        <div className="image-details">
          <h4>{t('Image properties')}</h4>
          <div className="detail-row">
            <label>{t('Name:')}</label>
            <input
              type="text"
              value={selectedImage.name}
              onChange={(e) => updateImage(selectedImage.id, { name: e.target.value })}
            />
          </div>
          <div className="detail-row">
            <label>{t('C variable name:')}</label>
            <input
              type="text"
              value={selectedImage.cArrayName}
              onChange={(e) => updateImage(selectedImage.id, { cArrayName: e.target.value })}
            />
          </div>
          <div className="detail-row">
            <label>{t('Size:')}</label>
            <span>{selectedImage.width} × {selectedImage.height}</span>
          </div>
          <div className="detail-row">
            <label>{t('File size:')}</label>
            <span>{formatFileSize(selectedImage.size)}</span>
          </div>
          <div className="detail-row">
            <label>{t('Color format:')}</label>
            <select
              value={selectedImage.format}
              onChange={(e) => updateImage(selectedImage.id, { format: e.target.value as ImageFormat })}
            >
              <option value="RGB565">RGB565 (16-bit)</option>
              <option value="RGB888">RGB888 (24-bit)</option>
              <option value="ARGB8888">ARGB8888 (32-bit)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManager;
