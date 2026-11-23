// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import { computeImagePlacement, imagesToPDF } from './index';

describe('PDF Engine', () => {
  // Vector: A4 portrait, margin 36, image 1600×1200 px → drawn 523.28 × 392.46 pt at x=36, y≈224.72 from the bottom
  it('correctly calculates placement test vector', () => {
    const placement = computeImagePlacement(1600, 1200, {
      pageSize: 'A4',
      orientation: 'portrait',
      marginPt: 36,
      fit: 'contain',
    });

    expect(placement.pageWidth).toBe(595.28);
    expect(placement.pageHeight).toBe(841.89);
    expect(placement.width).toBe(523.28);
    expect(placement.height).toBe(392.46);
    expect(placement.x).toBe(36);
    expect(Math.round(placement.y * 100) / 100).toBeCloseTo(224.72, 1);
  });

  it('handles fit to image mode without scaling', () => {
    const placement = computeImagePlacement(800, 600, {
      pageSize: 'FitToImage',
      marginPt: 10,
    });

    expect(placement.pageWidth).toBe(820);
    expect(placement.pageHeight).toBe(620);
    expect(placement.width).toBe(800);
    expect(placement.height).toBe(600);
    expect(placement.x).toBe(10);
    expect(placement.y).toBe(10);
  });

  it('swaps dimensions in landscape orientation', () => {
    const placement = computeImagePlacement(1000, 1000, {
      pageSize: 'Letter',
      orientation: 'landscape',
      marginPt: 0,
    });

    expect(placement.pageWidth).toBe(792);
    expect(placement.pageHeight).toBe(612);
  });

  it('creates valid PDF bytes using pdf-lib', async () => {
    // 1x1 transparent PNG byte array
    const png1x1 = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1,
      8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 96, 0,
      0, 0, 2, 0, 1, 229, 39, 222, 250, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
    ]);

    const pdfBytes = await imagesToPDF([{
      bytes: png1x1,
      width: 1,
      height: 1,
      format: 'png',
    }], { pageSize: 'A4' });

    expect(pdfBytes.length).toBeGreaterThan(0);
    // PDF header starts with %PDF-
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
