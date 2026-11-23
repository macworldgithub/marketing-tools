import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateAge, parseDateString, daysInMonth, isLeapYear } from './index';

describe('Age Calculator Engine', () => {
  // Test Vectors:
  // 1990-05-15 → 2026-11-23 = 36 6 8 (13,341 total days)
  it('calculates vector 1990-05-15 to 2026-11-23', () => {
    const from = parseDateString('1990-05-15');
    const to = parseDateString('2026-11-23');
    const result = calculateAge(from, to);

    expect(result.years).toBe(36);
    expect(result.months).toBe(6);
    expect(result.days).toBe(8);
    expect(result.totalDays).toBe(13341);
    expect(result.dayOfWeekBorn).toBe('Tuesday');
  });

  // 2000-02-29 → 2026-02-28 = 26 0 0
  it('calculates vector 2000-02-29 to 2026-02-28', () => {
    const from = parseDateString('2000-02-29');
    const to = parseDateString('2026-02-28');
    const result = calculateAge(from, to);

    expect(result.years).toBe(26);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);
  });

  // 2000-02-29 → 2026-03-01 = 26 0 1
  it('calculates vector 2000-02-29 to 2026-03-01', () => {
    const from = parseDateString('2000-02-29');
    const to = parseDateString('2026-03-01');
    const result = calculateAge(from, to);

    expect(result.years).toBe(26);
    expect(result.months).toBe(0);
    expect(result.days).toBe(1);
  });

  // 2000-01-31 → 2000-03-01 = 0 1 1
  it('calculates vector 2000-01-31 to 2000-03-01', () => {
    const from = parseDateString('2000-01-31');
    const to = parseDateString('2000-03-01');
    const result = calculateAge(from, to);

    expect(result.years).toBe(0);
    expect(result.months).toBe(1);
    expect(result.days).toBe(1);
  });

  // 2000-01-31 → 2000-02-29 = 0 1 0
  it('calculates vector 2000-01-31 to 2000-02-29', () => {
    const from = parseDateString('2000-01-31');
    const to = parseDateString('2000-02-29');
    const result = calculateAge(from, to);

    expect(result.years).toBe(0);
    expect(result.months).toBe(1);
    expect(result.days).toBe(0);
  });

  // 2024-02-29 → 2026-11-23 = 2 8 25
  it('calculates vector 2024-02-29 to 2026-11-23', () => {
    const from = parseDateString('2024-02-29');
    const to = parseDateString('2026-11-23');
    const result = calculateAge(from, to);

    expect(result.years).toBe(2);
    expect(result.months).toBe(8);
    expect(result.days).toBe(25);
  });

  // Same day = 0 0 0
  it('calculates same day = 0 0 0', () => {
    const from = parseDateString('2024-05-10');
    const to = parseDateString('2024-05-10');
    const result = calculateAge(from, to);

    expect(result.years).toBe(0);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);
    expect(result.totalDays).toBe(0);
  });

  it('rejects "age at" earlier than date of birth', () => {
    const from = parseDateString('2025-01-01');
    const to = parseDateString('2024-01-01');
    expect(() => calculateAge(from, to)).toThrow();
  });

  // Property test: anchor <= to and 0 <= days < 31 always hold
  it('satisfies invariant 0 <= days < 31 across arbitrary dates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1950, max: 2050 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 0, max: 20000 }),
        (y, m, d, addDays) => {
          const fromUtc = Date.UTC(y, m - 1, d);
          const toUtc = fromUtc + addDays * 86400000;
          const toDate = new Date(toUtc);

          const from = { year: y, month: m, day: d };
          const to = {
            year: toDate.getUTCFullYear(),
            month: toDate.getUTCMonth() + 1,
            day: toDate.getUTCDate(),
          };

          const result = calculateAge(from, to);
          expect(result.days).toBeGreaterThanOrEqual(0);
          expect(result.days).toBeLessThan(31);
        }
      ),
      { numRuns: 100 }
    );
  });
});

