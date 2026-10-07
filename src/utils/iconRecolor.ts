import type { ImageResource } from '../resources/types';

/** Library icons (resources named icon_*.png) are drawn in the theme's text color so they stay visible on dark themes. */
export function isIconImage(src: string | undefined, images: ImageResource[]): boolean {
  if (!src) return false;
  const img = images.find(i => i.id === src || i.name === src || i.cArrayName === src);
  return !!img && img.originalName.startsWith('icon_');
}
