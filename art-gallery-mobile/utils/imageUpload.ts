import type { ImagePickerAsset } from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface NormalizedUploadImage {
  uri: string;
  name: string;
  type: string;
}

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const extensionFromMime = (mimeType: string) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}[mimeType] || 'jpg');

const normalizedMimeType = (asset: ImagePickerAsset) => {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType && SUPPORTED_MIME_TYPES.has(mimeType)) return mimeType;

  const source = `${asset.fileName || ''} ${asset.uri}`.toLowerCase();
  if (/\.png(?:$|[?#\s])/.test(source)) return 'image/png';
  if (/\.webp(?:$|[?#\s])/.test(source)) return 'image/webp';
  if (/\.jpe?g(?:$|[?#\s])/.test(source)) return 'image/jpeg';
  return undefined;
};

const requiresJpegConversion = (asset: ImagePickerAsset) => {
  const source = `${asset.mimeType || ''} ${asset.fileName || ''} ${asset.uri}`.toLowerCase();
  return /image\/(?:heic|heif)|\.hei[cf](?:$|[?#\s])/.test(source) || !normalizedMimeType(asset);
};

/**
 * Produces a real JPEG cache file for HEIC/HEIF (and unknown image formats).
 * Supported JPEG/PNG/WEBP assets keep their original bytes and URI.
 */
export async function normalizeImageForUpload(
  asset: ImagePickerAsset,
  filePrefix = 'image'
): Promise<NormalizedUploadImage> {
  if (requiresJpegConversion(asset)) {
    const context = ImageManipulator.manipulate(asset.uri);
    const renderedImage = await context.renderAsync();
    const jpeg = await renderedImage.saveAsync({
      compress: 0.9,
      format: SaveFormat.JPEG,
    });

    return {
      uri: jpeg.uri,
      name: `${filePrefix}-${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  }

  const type = normalizedMimeType(asset)!;
  const extension = extensionFromMime(type);
  const originalName = asset.fileName?.trim();
  const hasMatchingExtension = originalName
    ? new RegExp(`\\.${extension === 'jpg' ? 'jpe?g' : extension}$`, 'i').test(originalName)
    : false;

  return {
    uri: asset.uri,
    name: hasMatchingExtension ? originalName! : `${filePrefix}-${Date.now()}.${extension}`,
    type,
  };
}
