import { describe, it, expect } from 'vitest';
import { generateFakePeople, toCSV, LocaleKey } from './index';

describe('Fake Name & Data Generator Engine', () => {
  it('generates specified count of people with safe emails and phone numbers', () => {
    const people = generateFakePeople({ count: 5, locale: 'US', gender: 'male' });
    expect(people.length).toBe(5);

    for (const p of people) {
      expect(p.gender).toBe('Male');
      expect(p.locale).toBe('US');
      // Strictly safe domains: example.com, example.org, example.net
      expect(p.email).toMatch(/@(example\.com|example\.org|example\.net)$/);
      // US phone must be in fictional 555-0100..555-0199 range
      expect(p.phone).toMatch(/555-01\d{2}/);
    }
  });

  it('supports all required locales with non-empty datasets', () => {
    const locales: LocaleKey[] = ['US', 'UK', 'India', 'Pakistan', 'Canada', 'Australia'];
    for (const loc of locales) {
      const people = generateFakePeople({ count: 2, locale: loc });
      expect(people.length).toBe(2);
      expect(people[0].firstName).toBeTruthy();
      expect(people[0].lastName).toBeTruthy();
    }
  });

  it('produces reproducible results when seed is provided', () => {
    const run1 = generateFakePeople({ count: 5, seed: 12345 });
    const run2 = generateFakePeople({ count: 5, seed: 12345 });

    expect(run1).toEqual(run2);
  });

  it('converts generated data to valid CSV format', () => {
    const people = generateFakePeople({ count: 3, seed: 42 });
    const csv = toCSV(people);
    const lines = csv.split('\n');

    expect(lines.length).toBe(4); // Header + 3 rows
    expect(lines[0]).toContain('First Name,Last Name,Full Name');
  });
});
