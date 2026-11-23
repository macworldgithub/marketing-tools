// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import {
  calculateDimensionsByWidth,
  calculateDimensionsByPercentage,
  calculateCompressionSaved,
} from './index';

describe('Image IO Engine', () => {
  // Vector 1: 4000×3000, width 1200 locked → 1200×900
  it('correctly calculates vector: 4000x3000 at width 1200', () => {
    const dims = calculateDimensionsByWidth(4000, 3000, 1200);
    expect(dims.width).toBe(1200);
    expect(dims.height).toBe(900);
  });

  // Vector 2: 50% of 4000×3000 → 2000×1500
  it('correctly calculates vector: 50% of 4000x3000', () => {
    const dims = calculateDimensionsByPercentage(4000, 3000, 50);
    expect(dims.width).toBe(2000);
    expect(dims.height).toBe(1500);
  });

  // Compression vector: 2,000,000 B → 500,000 B = 75.0%
  it('correctly calculates compression savings vector', () => {
    const saved = calculateCompressionSaved(2000000, 500000);
    expect(saved).toBe(75.0);
  });
});

