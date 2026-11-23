// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import {
  percentageOf,
  whatPercentageOf,
  percentageOfWhat,
  increaseDecreaseBy,
  percentageChange,
  percentageDifference,
} from './index';

describe('Percentage Calculator Engine', () => {
  // Test Vectors:
  // 15% of 200 = 30
  it('calculates 15% of 200 = 30', () => {
    expect(percentageOf(15, 200)).toBe('30');
  });

  // 30 is what % of 200 = 15%
  it('calculates 30 is what % of 200 = 15', () => {
    expect(whatPercentageOf(30, 200)).toBe('15');
  });

  // 30 is 15% of what = 200
  it('calculates 30 is 15% of what = 200', () => {
    expect(percentageOfWhat(30, 15)).toBe('200');
  });

  // 50 → 75 = +50%
  it('calculates percentage change 50 to 75 = +50%', () => {
    const res = percentageChange(50, 75);
    expect(res.change).toBe('50');
    expect(res.isIncrease).toBe(true);
  });

  // 75 → 50 = −33.3333%
  it('calculates percentage change 75 to 50 = -33.3333%', () => {
    const res = percentageChange(75, 50);
    expect(res.change).toBe('33.333333');
    expect(res.isIncrease).toBe(false);
  });

  // % difference between 50 and 75 = 40%
  it('calculates percentage difference 50 vs 75 = 40%', () => {
    expect(percentageDifference(50, 75)).toBe('40');
    // Symmetric check
    expect(percentageDifference(75, 50)).toBe('40');
  });

  // Increase 200 by 15% = 230
  it('calculates increase 200 by 15% = 230', () => {
    expect(increaseDecreaseBy(200, 15, true)).toBe('230');
  });
});

