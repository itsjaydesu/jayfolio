'use client';

export const MIN_CROP_EDGE = 200;
export const TARGET_DISPLAY_WIDTH = 1280;
export const UPSCALE_THRESHOLD = 1.5;

export function sanitizeAlt(value) {
  if (!value) return '';
  const base = String(value)
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base.slice(0, 200);
}

export function buildFileNameFromAlt(altText, fallback = 'cover', extension = '.jpg') {
  const base = sanitizeAlt(altText || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  const safeBase = base || 'cover-image';
  const safeExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return `${safeBase}${safeExtension}`;
}

export async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function computeCropResolution(crop, image) {
  if (!crop || !image) {
    return { width: 0, height: 0 };
  }
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const width = Math.round(crop.width * scaleX);
  const height = Math.round(crop.height * scaleY);
  return { width, height };
}

export async function createCroppedBlob(image, crop, fileType, quality = 0.92, options = {}) {
  if (!crop || !image) {
    throw new Error('Missing crop or image reference.');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context unavailable.');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  const baseWidth = Math.max(1, Math.floor(crop.width * scaleX));
  const baseHeight = Math.max(1, Math.floor(crop.height * scaleY));

  let targetWidth = baseWidth;
  let targetHeight = baseHeight;

  if (options?.maxWidth && Number.isFinite(options.maxWidth) && options.maxWidth > 0) {
    if (targetWidth > options.maxWidth) {
      const ratio = targetHeight / targetWidth;
      targetWidth = Math.floor(options.maxWidth);
      targetHeight = Math.max(1, Math.floor(targetWidth * ratio));
    }
  }

  if (options?.maxHeight && Number.isFinite(options.maxHeight) && options.maxHeight > 0) {
    if (targetHeight > options.maxHeight) {
      const ratio = targetWidth / targetHeight;
      targetHeight = Math.floor(options.maxHeight);
      targetWidth = Math.max(1, Math.floor(targetHeight * ratio));
    }
  }

  const mimeType = typeof options?.mimeType === 'string' && options.mimeType.length
    ? options.mimeType
    : fileType || 'image/jpeg';

  canvas.width = Math.max(1, Math.floor(targetWidth * pixelRatio));
  canvas.height = Math.max(1, Math.floor(targetHeight * pixelRatio));

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Crop failed.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}
