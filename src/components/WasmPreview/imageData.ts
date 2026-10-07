import type { ImageResource } from '../../resources/types';

export interface WasmImage {
  w: number;
  h: number;
  /** base64 of w*h*4 bytes in LVGL ARGB8888 order (B, G, R, A) */
  data: string;
}

const MAX_SIDE = 256;
const cache = new Map<string, Promise<WasmImage>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });
}

async function encode(res: ImageResource): Promise<WasmImage> {
  const img = await loadImage(res.data);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const bgra = new Uint8Array(px.length);
  for (let i = 0; i < px.length; i += 4) {
    bgra[i] = px[i + 2];
    bgra[i + 1] = px[i + 1];
    bgra[i + 2] = px[i];
    bgra[i + 3] = px[i + 3];
  }
  let bin = '';
  for (let i = 0; i < bgra.length; i += 0x8000) bin += String.fromCharCode(...bgra.subarray(i, i + 0x8000));
  return { w, h, data: btoa(bin) };
}

/** Raw pixels of the given image resources, keyed by resource id (decoded once per resource). */
export async function encodeImagesForWasm(resources: ImageResource[]): Promise<Record<string, WasmImage>> {
  const out: Record<string, WasmImage> = {};
  await Promise.all(resources.map(async res => {
    const key = `${res.id}:${res.data.length}`;
    let p = cache.get(key);
    if (!p) { p = encode(res); cache.set(key, p); }
    try { out[res.id] = await p; } catch { cache.delete(key); }
  }));
  return out;
}
