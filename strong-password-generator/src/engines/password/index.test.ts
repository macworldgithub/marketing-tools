// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import {
  calculateEntropy,
  getStrengthLabel,
  generatePassword,
  generatePIN,
  getSecureRandomInt,
} from './index';

describe('Password Generator Engine', () => {
  // Test Vectors:
  // length 16 over 94 chars → 104.87 bits
  it('correctly calculates vector: length 16 over 94 chars', () => {
    const entropy = calculateEntropy(16, 94);
    expect(entropy).toBe(104.87);
    expect(getStrengthLabel(entropy)).toBe('Very strong');
  });

  // length 12 over 62 chars → 71.45 bits
  it('correctly calculates vector: length 12 over 62 chars', () => {
    const entropy = calculateEntropy(12, 62);
    expect(entropy).toBe(71.45);
    expect(getStrengthLabel(entropy)).toBe('Good');
  });

  // 6 words from 7,776-word list → 77.55 bits
  it('correctly calculates vector: 6 words from 7,776 list', () => {
    const entropy = calculateEntropy(6, 7776);
    expect(entropy).toBe(77.55);
    expect(getStrengthLabel(entropy)).toBe('Good');
  });

  it('guarantees at least one character from each selected class', () => {
    const passwords = generatePassword({
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      count: 10,
    });

    for (const p of passwords) {
      expect(/[A-Z]/.test(p.value)).toBe(true);
      expect(/[a-z]/.test(p.value)).toBe(true);
      expect(/[0-9]/.test(p.value)).toBe(true);
      expect(/[^a-zA-Z0-9]/.test(p.value)).toBe(true);
    }
  });

  it('excludes ambiguous characters when configured', () => {
    const passwords = generatePassword({
      length: 20,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: true,
      count: 10,
    });

    const ambiguousRegex = /[Il1O0]/;
    for (const p of passwords) {
      expect(ambiguousRegex.test(p.value)).toBe(false);
    }
  });

  it('generates secure numeric PINs', () => {
    const pins = generatePIN(6, 5);
    expect(pins).toHaveLength(5);
    for (const pin of pins) {
      expect(pin.value).toHaveLength(6);
      expect(/^\d{6}$/.test(pin.value)).toBe(true);
    }
  });

  // Statistical distribution test (10k samples)
  it('produces approximately uniform distribution across values', () => {
    const bins = new Array(10).fill(0);
    const totalSamples = 10000;

    for (let i = 0; i < totalSamples; i++) {
      const val = getSecureRandomInt(10);
      bins[val]++;
    }

    // Expected frequency ~1000 per bin (with +/- 15% tolerance)
    for (const count of bins) {
      expect(count).toBeGreaterThan(850);
      expect(count).toBeLessThan(1150);
    }
  });
});

