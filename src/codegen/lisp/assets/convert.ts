// Convert the images and fonts used by a project into the .bin files the generated code imports

import type { Page } from '../../../types';
import type { ImageResource, FontResource } from '../../../resources/types';
import { collectUsedImages, collectUsedCustomFonts } from '../ui';
import { imageToVesc, fontToVesc } from './rasterize';

export interface ConvertedAssets {
  /** project path (`assets/x.bin`, `font/y_16.bin`) -> bytes */
  files: Record<string, Uint8Array>;
  /** image resource id -> palette for lv-image-set-vesc */
  imagePalettes: Record<string, Array<number | null>>;
  /** problems that did not stop the conversion */
  errors: string[];
}

const cache = new Map<string, Promise<unknown>>();

/** Memoise conversions: the key changes whenever the resource data changes. */
function cached<T>(key: string, make: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = make();
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return p;
}

function fingerprint(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += Math.max(1, Math.floor(s.length / 4096))) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return `${s.length}:${(h >>> 0).toString(16)}`;
}

export async function convertAssets(
  pages: Page[],
  images: ImageResource[],
  fonts: FontResource[],
  defaultFont?: string,
  defaultFontSize?: number
): Promise<ConvertedAssets> {
  const result: ConvertedAssets = { files: {}, imagePalettes: {}, errors: [] };

  for (const img of collectUsedImages(pages, images)) {
    try {
      const v = await cached(`img:${img.id}:${fingerprint(img.data)}`, () => imageToVesc(img));
      result.files[`assets/${img.cArrayName}.bin`] = v.bin;
      result.imagePalettes[img.id] = v.palette;
    } catch (e) {
      result.errors.push(`${img.name}: ${(e as Error).message}`);
    }
  }

  for (const [name, sizes] of collectUsedCustomFonts(pages, fonts, defaultFont, defaultFontSize)) {
    const res = fonts.find(f => f.cFontName === name);
    if (!res) continue;
    for (const size of [...sizes].sort((a, b) => a - b)) {
      try {
        const bin = await cached(
          `font:${res.id}:${size}:${res.bpp}:${res.charset}:${res.customChars ?? ''}:${fingerprint(res.data)}`,
          () => fontToVesc(res, size)
        );
        result.files[`font/${name}_${size}.bin`] = bin;
      } catch (e) {
        result.errors.push(`${res.name} ${size}px: ${(e as Error).message}`);
      }
    }
  }
  return result;
}
