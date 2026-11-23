// GENERATED from _template — do not edit here
export interface ImageDimensions {
  width: number;
  height: number;
}

export function calculateDimensionsByWidth(
  origWidth: number,
  origHeight: number,
  targetWidth: number
): ImageDimensions {
  if (origWidth <= 0 || origHeight <= 0 || targetWidth <= 0) {
    throw new Error('Dimensions must be positive numbers.');
  }
  const targetHeight = Math.max(1, Math.round((targetWidth * origHeight) / origWidth));
  return {
    width: targetWidth,
    height: targetHeight,
  };
}

export function calculateDimensionsByHeight(
  origWidth: number,
  origHeight: number,
  targetHeight: number
): ImageDimensions {
  if (origWidth <= 0 || origHeight <= 0 || targetHeight <= 0) {
    throw new Error('Dimensions must be positive numbers.');
  }
  const targetWidth = Math.max(1, Math.round((targetHeight * origWidth) / origHeight));
  return {
    width: targetWidth,
    height: targetHeight,
  };
}

export function calculateDimensionsByPercentage(
  origWidth: number,
  origHeight: number,
  percentage: number
): ImageDimensions {
  if (origWidth <= 0 || origHeight <= 0 || percentage <= 0) {
    throw new Error('Dimensions and percentage must be positive.');
  }
  const targetWidth = Math.max(1, Math.round((origWidth * percentage) / 100));
  const targetHeight = Math.max(1, Math.round((origHeight * percentage) / 100));
  return {
    width: targetWidth,
    height: targetHeight,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function calculateCompressionSaved(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0) return 0;
  const saved = ((1 - compressedBytes / originalBytes) * 100);
  return Number(saved.toFixed(1));
}

