// Font Converter for LVGL
// Note: Full font conversion requires lv_font_conv or similar tool
// This provides basic font management and C code generation structure

import type { CharsetType, FontConversionOptions, CharsetPreset } from '../types';

export interface ConvertedFont {
  cCode: string;
  glyphCount: number;
  sizes: number[];
}

/**
 * Get character ranges for charset type
 */
export function getCharsetRanges(
  charset: CharsetType,
  customChars?: string,
  presets?: CharsetPreset[]
): [number, number][] {
  const charsetPresets = presets || [
    { id: 'ascii', ranges: [[32, 126]] },
    { id: 'latin', ranges: [[32, 126], [160, 591]] },
    { id: 'cjk-basic', ranges: [[32, 126], [0x4E00, 0x9FFF]] },
    { id: 'custom', ranges: [] },
  ] as CharsetPreset[];

  if (charset === 'custom' && customChars) {
    // Convert custom characters to ranges
    const codePoints = Array.from(new Set(
      Array.from(customChars).map(c => c.codePointAt(0) || 0)
    )).sort((a, b) => a - b);
    
    if (codePoints.length === 0) return [[32, 126]];

    // Group consecutive code points into ranges
    const ranges: [number, number][] = [];
    let start = codePoints[0];
    let end = codePoints[0];
    
    for (let i = 1; i < codePoints.length; i++) {
      if (codePoints[i] === end + 1) {
        end = codePoints[i];
      } else {
        ranges.push([start, end]);
        start = codePoints[i];
        end = codePoints[i];
      }
    }
    ranges.push([start, end]);
    
    return ranges;
  }
  
  const preset = charsetPresets.find(p => p.id === charset);
  return (preset?.ranges || [[32, 126]]) as [number, number][];
}

/**
 * Count glyphs in charset
 */
export function countGlyphs(ranges: [number, number][]): number {
  return ranges.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
}

/**
 * Extract unique characters from text
 */
export function extractCharsFromText(text: string): string {
  const chars = new Set(text);
  // Always include basic ASCII printable characters
  for (let i = 32; i <= 126; i++) {
    chars.add(String.fromCharCode(i));
  }
  return Array.from(chars).sort().join('');
}

/**
 * Decode base64 font data to Uint8Array
 */
function decodeBase64ToBytes(base64Data: string): Uint8Array {
  const raw = base64Data.replace(/^data:[^;]+;base64,/, '');
  const binaryString = atob(raw);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Read uint16 big-endian from byte array
 */
function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

/**
 * Read uint32 big-endian from byte array
 */
function readUint32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

/**
 * Parse font file and extract metadata by reading the TTF/OTF name table.
 * Extracts nameID 1 (Font Family) and nameID 2 (Font Subfamily / Style).
 */
export async function parseFontMetadata(base64Data: string): Promise<{
  family: string;
  style: string;
  unitsPerEm: number;
}> {
  try {
    const bytes = decodeBase64ToBytes(base64Data);

    // Validate magic number
    const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const isValidFont = magic === '\x00\x01\x00\x00' || // TTF
                        magic === 'OTTO' ||              // OTF (CFF)
                        magic === 'true' ||              // TrueType (Apple)
                        magic === 'typ1';                // Type 1
    if (!isValidFont) {
      throw new Error('Invalid font file format');
    }

    const numTables = readUint16BE(bytes, 4);

    // Locate 'name' and 'head' tables from the table directory
    let nameTableOffset = 0;
    let headTableOffset = 0;

    for (let i = 0; i < numTables; i++) {
      const entryOffset = 12 + i * 16;
      const tag = String.fromCharCode(
        bytes[entryOffset], bytes[entryOffset + 1],
        bytes[entryOffset + 2], bytes[entryOffset + 3]
      );
      const tableOffset = readUint32BE(bytes, entryOffset + 8);

      if (tag === 'name') nameTableOffset = tableOffset;
      if (tag === 'head') headTableOffset = tableOffset;
    }

    // Parse unitsPerEm from head table
    let unitsPerEm = 1000;
    if (headTableOffset > 0 && headTableOffset + 18 + 2 <= bytes.length) {
      unitsPerEm = readUint16BE(bytes, headTableOffset + 18);
    }

    // Parse name table
    let family = 'Unknown';
    let style = 'Regular';

    if (nameTableOffset > 0) {
      const count = readUint16BE(bytes, nameTableOffset + 2);
      const stringOffset = readUint16BE(bytes, nameTableOffset + 4);
      const storageStart = nameTableOffset + stringOffset;

      // We'll collect candidates; prefer platformID 3 (Windows) with encodingID 1 (Unicode BMP)
      // Fall back to platformID 1 (Macintosh) with encodingID 0 (Roman)
      let familyWin = '';
      let styleWin = '';
      let familyMac = '';
      let styleMac = '';

      for (let i = 0; i < count; i++) {
        const recordOffset = nameTableOffset + 6 + i * 12;
        if (recordOffset + 12 > bytes.length) break;

        const platformID = readUint16BE(bytes, recordOffset);
        const encodingID = readUint16BE(bytes, recordOffset + 2);
        const nameID = readUint16BE(bytes, recordOffset + 6);
        const length = readUint16BE(bytes, recordOffset + 8);
        const offset = readUint16BE(bytes, recordOffset + 10);

        const strStart = storageStart + offset;
        if (strStart + length > bytes.length) continue;

        // Only care about nameID 1 (family) and nameID 2 (style)
        if (nameID !== 1 && nameID !== 2) continue;

        let decoded = '';

        if (platformID === 3 && encodingID === 1) {
          // Windows Unicode BMP — UTF-16BE
          const chars: string[] = [];
          for (let j = 0; j < length; j += 2) {
            chars.push(String.fromCharCode(readUint16BE(bytes, strStart + j)));
          }
          decoded = chars.join('');
        } else if (platformID === 1 && encodingID === 0) {
          // Macintosh Roman — single-byte
          const chars: string[] = [];
          for (let j = 0; j < length; j++) {
            chars.push(String.fromCharCode(bytes[strStart + j]));
          }
          decoded = chars.join('');
        } else {
          continue;
        }

        if (!decoded.trim()) continue;

        if (platformID === 3) {
          if (nameID === 1) familyWin = decoded;
          if (nameID === 2) styleWin = decoded;
        } else {
          if (nameID === 1) familyMac = decoded;
          if (nameID === 2) styleMac = decoded;
        }
      }

      family = familyWin || familyMac || 'Unknown';
      style = styleWin || styleMac || 'Regular';
    }

    return { family, style, unitsPerEm };
  } catch (error) {
    console.error('Failed to parse font:', error);
    return { family: 'Unknown', style: 'Regular', unitsPerEm: 1000 };
  }
}

/**
 * Convert font file to base64
 */
export function fontFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read font file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Default font conversion options
 */
export const DEFAULT_FONT_OPTIONS: FontConversionOptions = {
  sizes: [16],
  charset: 'ascii',
  bpp: 4,
  compress: false,
};

/**
 * Common font sizes for UI
 */
export const COMMON_FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

/**
 * Preview text for font display
 */
export const FONT_PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog. 0123456789';
export const FONT_PREVIEW_TEXT_CJK = 'The quick brown fox 0123456789 Привет';
