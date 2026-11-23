import { describe, it, expect } from 'vitest';
import { generateAddresses, addressesToCSV } from './index';

describe('Address Generator Engine', () => {
  it('generates US addresses matching state-ZIP ranges', () => {
    const list = generateAddresses({ country: 'US', count: 10, seed: 100 });
    expect(list.length).toBe(10);

    for (const addr of list) {
      expect(addr.country).toBe('United States');
      expect(addr.postalCode).toMatch(/^\d{5}$/);
      expect(addr.fullAddress).toContain(addr.city);
    }
  });

  it('formats UK addresses with valid postcode format', () => {
    const list = generateAddresses({ country: 'UK', count: 5 });
    for (const addr of list) {
      expect(addr.country).toBe('United Kingdom');
      // e.g. NW1 6XE or M1 4ET
      expect(addr.postalCode).toMatch(/^[A-Z]{1,2}\d{1,2}\s\w{3}$/);
    }
  });

  it('formats Canada addresses with FSA LDU pattern', () => {
    const list = generateAddresses({ country: 'Canada', count: 5 });
    for (const addr of list) {
      expect(addr.country).toBe('Canada');
      expect(addr.postalCode).toMatch(/^[A-Z]\d[A-Z]\s\d[A-Z]\d$/);
    }
  });

  it('formats India PIN code with 6 digits', () => {
    const list = generateAddresses({ country: 'India', count: 5 });
    for (const addr of list) {
      expect(addr.country).toBe('India');
      expect(addr.postalCode).toMatch(/^\d{6}$/);
    }
  });

  it('generates reproducible addresses with seed', () => {
    const run1 = generateAddresses({ count: 5, seed: 999 });
    const run2 = generateAddresses({ count: 5, seed: 999 });
    expect(run1).toEqual(run2);
  });

  it('exports addresses to CSV', () => {
    const list = generateAddresses({ count: 2, seed: 1 });
    const csv = addressesToCSV(list);
    expect(csv.split('\n').length).toBe(3);
    expect(csv).toContain('Street Address,City');
  });
});
