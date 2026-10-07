// Turn a built-in vector icon into an image resource so it can be dropped on the canvas

import { useResourceStore } from './resourceStore';
import type { ImageResource } from './types';

const ICON_COLOR = '#212121';
const ICON_SIZE = 64;

async function svgPathToPng(path: string, color: string, size: number): Promise<Blob> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${path}" fill="${color}"/></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to render icon'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Failed to encode icon'))), 'image/png')
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Image resource for a built-in icon; created on first use, reused afterwards. */
export async function getIconImageResource(name: string, path: string): Promise<ImageResource> {
  const store = useResourceStore.getState();
  const fileName = `icon_${name}.png`;
  const existing = store.images.find(i => i.originalName === fileName);
  if (existing) return existing;
  const blob = await svgPathToPng(path, ICON_COLOR, ICON_SIZE);
  return store.addImage(new File([blob], fileName, { type: 'image/png' }));
}
