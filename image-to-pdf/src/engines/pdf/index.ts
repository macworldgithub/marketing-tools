// GENERATED from _template — do not edit here
import { PDFDocument } from 'pdf-lib';

export type PageSizeOption = 'A4' | 'Letter' | 'FitToImage';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type PageFit = 'contain' | 'cover' | 'stretch';

export interface PDFImageInput {
  bytes: Uint8Array;
  width: number;
  height: number;
  format: 'jpeg' | 'png';
  name?: string;
}

export interface PDFExportOptions {
  pageSize?: PageSizeOption;
  orientation?: PageOrientation;
  marginPt?: number; // 0, 18, 36
  fit?: PageFit;
}

export const PAGE_SIZES_PT = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612.0, height: 792.0 },
};

export interface ImagePlacementResult {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pure geometry helper to compute image dimensions and position on a PDF page
 */
export function computeImagePlacement(
  imgWidth: number,
  imgHeight: number,
  options: PDFExportOptions = {}
): ImagePlacementResult {
  const { pageSize = 'A4', orientation = 'portrait', marginPt = 0, fit = 'contain' } = options;

  let pageW: number;
  let pageH: number;

  if (pageSize === 'FitToImage') {
    pageW = imgWidth + marginPt * 2;
    pageH = imgHeight + marginPt * 2;
  } else {
    const base = PAGE_SIZES_PT[pageSize] || PAGE_SIZES_PT.A4;
    let isLandscape = false;
    if (orientation === 'landscape') isLandscape = true;
    else if (orientation === 'auto') isLandscape = imgWidth > imgHeight;

    pageW = isLandscape ? Math.max(base.width, base.height) : Math.min(base.width, base.height);
    pageH = isLandscape ? Math.min(base.width, base.height) : Math.max(base.width, base.height);
  }

  const availW = Math.max(0, pageW - marginPt * 2);
  const availH = Math.max(0, pageH - marginPt * 2);

  let drawnW = availW;
  let drawnH = availH;

  if (fit === 'contain') {
    const scale = Math.min(availW / imgWidth, availH / imgHeight);
    drawnW = Number((imgWidth * scale).toFixed(2));
    drawnH = Number((imgHeight * scale).toFixed(2));
  } else if (fit === 'cover') {
    const scale = Math.max(availW / imgWidth, availH / imgHeight);
    drawnW = Number((imgWidth * scale).toFixed(2));
    drawnH = Number((imgHeight * scale).toFixed(2));
  } else if (fit === 'stretch') {
    drawnW = Number(availW.toFixed(2));
    drawnH = Number(availH.toFixed(2));
  }

  const x = Number((marginPt + (availW - drawnW) / 2).toFixed(2));
  const y = Number((marginPt + (availH - drawnH) / 2).toFixed(2));

  return {
    pageWidth: Number(pageW.toFixed(2)),
    pageHeight: Number(pageH.toFixed(2)),
    x,
    y,
    width: drawnW,
    height: drawnH,
  };
}

/**
 * Creates a PDF document from an array of image bytes
 */
export async function imagesToPDF(
  images: PDFImageInput[],
  options: PDFExportOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const placement = computeImagePlacement(img.width, img.height, options);
    const page = pdfDoc.addPage([placement.pageWidth, placement.pageHeight]);

    let embeddedImg;
    if (img.format === 'jpeg') {
      embeddedImg = await pdfDoc.embedJpg(img.bytes);
    } else {
      embeddedImg = await pdfDoc.embedPng(img.bytes);
    }

    page.drawImage(embeddedImg, {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    });
  }

  return await pdfDoc.save();
}
