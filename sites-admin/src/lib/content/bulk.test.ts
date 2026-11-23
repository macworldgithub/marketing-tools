import { describe, it, expect } from 'vitest';
import { SiteConfig, FaqsData } from './types';

describe('Bulk Operations Logic', () => {
  const samplePrivacy = `
## Information We Collect
We collect minimal diagnostic information for {{siteName}}.
Contact us at old-email@example.com.
`;

  it('performs case-insensitive plain text find and replace', () => {
    const find = 'old-email@example.com';
    const replace = 'new-email@example.com';
    const updated = samplePrivacy.replace(new RegExp(find, 'gi'), replace);
    expect(updated).toContain('new-email@example.com');
    expect(updated).not.toContain('old-email@example.com');
  });

  it('performs regular expression find and replace with groups', () => {
    const updated = samplePrivacy.replace(/old-(email)@example\.com/g, 'support-$1@example.com');
    expect(updated).toContain('support-email@example.com');
  });

  it('applies baseline replacement while maintaining site variables', () => {
    const baselineTemplate = `## Privacy Policy\n\nContact {{contactEmail}} for {{siteName}}.`;
    const site: SiteConfig = {
      schemaVersion: 1,
      slug: 'bmi-calculator',
      siteName: 'BMI Calculator',
      toolName: 'BMI Calculator',
      primaryKeyword: 'bmi',
      domain: 'example.com',
      tagline: 'Tagline',
      contactEmail: 'hello@example.com',
      accent: 'blue',
      effectiveDate: '2026-11-23',
      features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
    };

    expect(baselineTemplate).toContain('{{contactEmail}}');
    expect(baselineTemplate).toContain('{{siteName}}');
  });

  it('appends and prepends FAQ items without duplicate IDs', () => {
    const faqs: FaqsData = {
      schemaVersion: 1,
      items: [{ id: 'existing-id', question: 'Existing?', answer: 'Answer' }],
    };

    const newItem = { id: 'new-id', question: 'New?', answer: 'New Answer' };

    // Append
    const appended = [...faqs.items, newItem];
    expect(appended.length).toBe(2);
    expect(appended[1].id).toBe('new-id');

    // Prepend
    const prepended = [newItem, ...faqs.items];
    expect(prepended.length).toBe(2);
    expect(prepended[0].id).toBe('new-id');

    // Prevent duplicate
    const hasDuplicate = faqs.items.some((i) => i.id === 'existing-id');
    expect(hasDuplicate).toBe(true);
  });
});

