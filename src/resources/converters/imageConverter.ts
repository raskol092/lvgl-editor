// Image helpers: file/base64 conversion and decoding (the VESC .bin conversion lives in codegen/lisp/assets)

/**
 * Load image from base64 and get ImageData
 */
export async function loadImageFromBase64(base64Data: string): Promise<{
  imageData: ImageData;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      
      resolve({
        imageData,
        width: img.width,
        height: img.height,
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Handle both raw base64 and data URL
    if (base64Data.startsWith('data:')) {
      img.src = base64Data;
    } else {
      img.src = `data:image/png;base64,${base64Data}`;
    }
  });
}

/**
 * Convert image file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from base64
 */
export async function getImageDimensions(base64Data: string): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    if (base64Data.startsWith('data:')) {
      img.src = base64Data;
    } else {
      img.src = `data:image/png;base64,${base64Data}`;
    }
  });
}

