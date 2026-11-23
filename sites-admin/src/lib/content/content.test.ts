import { describe, it, expect } from 'vitest';
import { SiteSchema, FaqsSchema, FaqItemSchema } from './schemas';
import { renderLegalTemplate, buildContextFromSite } from './legal-template';
import { serializeSite, serializeFaqs, serializeMarkdown } from './serializer';
import { lintLegalMarkdown, lintFaqs } from './linter';
import { SiteConfig, FaqsData } from './types';

describe('Content Engine: Schemas', () => {
  const validSite: SiteConfig = {
    schemaVersion: 1,
    slug: 'bmi-calculator',
    siteName: 'BMI Calculator',
    toolName: 'BMI Calculator',
    primaryKeyword: 'bmi calculator',
    domain: 'example.com',
    tagline: 'Calculate BMI client-side.',
    contactEmail: 'contact@example.com',
    accent: 'blue',
    effectiveDate: '2026-11-23',
    features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
  };

  it('validates a correct site.json', () => {
    const res = SiteSchema.safeParse(validSite);
    expect(res.success).toBe(true);
  });

  it('rejects invalid accent and bad date format', () => {
    const invalidAccent = { ...validSite, accent: 'purple' };
    expect(SiteSchema.safeParse(invalidAccent).success).toBe(false);

    const invalidDate = { ...validSite, effectiveDate: '23-11-2026' };
    expect(SiteSchema.safeParse(invalidDate).success).toBe(false);
  });

  it('validates correct faqs.json and enforces limits', () => {
    const validFaqs: FaqsData = {
      schemaVersion: 1,
      items: [
        {
          id: 'what-is-bmi',
          question: 'What is BMI?',
          answer: 'Body mass index is a simple index of weight-for-height.',
        },
      ],
    };
    expect(FaqsSchema.safeParse(validFaqs).success).toBe(true);

    // Question too long (> 160)
    const longQuestion = {
      id: 'long-q',
      question: 'A'.repeat(161),
      answer: 'Valid answer',
    };
    expect(FaqItemSchema.safeParse(longQuestion).success).toBe(false);

    // Answer too long (> 2000)
    const longAnswer = {
      id: 'long-a',
      question: 'Valid question?',
      answer: 'A'.repeat(2001),
    };
    expect(FaqItemSchema.safeParse(longAnswer).success).toBe(false);

    // Raw HTML in answer forbidden
    const htmlAnswer = {
      id: 'html-a',
      question: 'Valid question?',
      answer: 'Answer with <script>alert(1)</script> tag',
    };
    expect(FaqItemSchema.safeParse(htmlAnswer).success).toBe(false);

    // Duplicate ID in faqs list
    const duplicateFaqs = {
      schemaVersion: 1,
      items: [
        { id: 'dup', question: 'Q1', answer: 'A1' },
        { id: 'dup', question: 'Q2', answer: 'A2' },
      ],
    };
    expect(FaqsSchema.safeParse(duplicateFaqs).success).toBe(false);
  });
});

describe('Content Engine: Legal Template Renderer', () => {
  const site: SiteConfig = {
    schemaVersion: 1,
    slug: 'bmi-calculator',
    siteName: 'BMI Calculator',
    toolName: 'BMI Calculator',
    primaryKeyword: 'bmi calculator',
    domain: 'example.com',
    tagline: 'Calculate BMI client-side.',
    contactEmail: 'contact@example.com',
    accent: 'blue',
    effectiveDate: '2026-11-23',
    features: { ads: true, analytics: 'plausible', localStorageKeys: ['theme'] },
  };

  it('interpolates variables and evaluates conditions deterministically', () => {
    const template = `
# Policy for {{siteName}}
Contact us at {{contactEmail}}.
{{#if ads}}
We display third-party advertisements.
{{/if}}
{{#if analytics}}
We use privacy-friendly analytics.
{{/if}}
`.trim();

    const context = buildContextFromSite(site);
    const rendered = renderLegalTemplate(template, context);

    expect(rendered).toContain('Policy for BMI Calculator');
    expect(rendered).toContain('Contact us at contact@example.com.');
    expect(rendered).toContain('We display third-party advertisements.');
    expect(rendered).toContain('We use privacy-friendly analytics.');
  });

  it('fails strictly on unknown variable', () => {
    const template = 'Welcome to {{unknownVar}}!';
    const context = buildContextFromSite(site);
    expect(() => renderLegalTemplate(template, context)).toThrow(/Unknown variable/);
  });

  it('fails strictly on unbalanced conditional tags', () => {
    const template = '{{#if ads}}Unbalanced block without closing';
    const context = buildContextFromSite(site);
    expect(() => renderLegalTemplate(template, context)).toThrow(/Unbalanced conditional blocks/);
  });

  it('fails strictly on unknown conditional tag', () => {
    const template = '{{#if unknownCondition}}Content{{/if}}';
    const context = buildContextFromSite(site);
    expect(() => renderLegalTemplate(template, context)).toThrow(/Unknown condition/);
  });
});

describe('Content Engine: Serializer', () => {
  it('preserves stable key order and 2-space indentation with trailing newline', () => {
    const site: SiteConfig = {
      schemaVersion: 1,
      slug: 'bmi-calculator',
      siteName: 'BMI Calculator',
      toolName: 'BMI Calculator',
      primaryKeyword: 'bmi calculator',
      domain: 'example.com',
      tagline: 'Calculate BMI client-side.',
      contactEmail: 'contact@example.com',
      accent: 'blue',
      effectiveDate: '2026-11-23',
      features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
    };

    const serialized = serializeSite(site);
    expect(serialized.endsWith('\n')).toBe(true);

    const keys = Object.keys(JSON.parse(serialized));
    expect(keys).toEqual([
      'schemaVersion',
      'slug',
      'siteName',
      'toolName',
      'primaryKeyword',
      'domain',
      'tagline',
      'contactEmail',
      'accent',
      'effectiveDate',
      'features',
    ]);
  });

  it('normalizes markdown to LF endings with trailing newline', () => {
    const winText = 'Heading\r\nParagraph\r\n\r\n';
    const serialized = serializeMarkdown(winText);
    expect(serialized).toBe('Heading\nParagraph\n');
  });
});

describe('Content Engine: Linter', () => {
  const site: SiteConfig = {
    schemaVersion: 1,
    slug: 'bmi-calculator',
    siteName: 'BMI Calculator',
    toolName: 'BMI Calculator',
    primaryKeyword: 'bmi calculator',
    domain: 'example.com',
    tagline: 'Calculate BMI client-side.',
    contactEmail: 'contact@example.com',
    accent: 'blue',
    effectiveDate: '2026-11-23',
    features: { ads: true, analytics: 'none', localStorageKeys: ['theme'] },
  };

  it('detects forbidden h1 headings', () => {
    const md = '# Forbidden Top Title\n\n## Allowed Heading\n\nContent paragraph.';
    const messages = lintLegalMarkdown(md, site, 'privacy');
    const h1Err = messages.find((m) => m.rule === 'no-h1-heading');
    expect(h1Err).toBeDefined();
    expect(h1Err?.type).toBe('error');
  });

  it('detects missing advertising clause when features.ads is true', () => {
    const md = '## Privacy Notice\n\nWe collect strictly essential diagnostics and log nothing.';
    const messages = lintLegalMarkdown(md, site, 'privacy');
    const adErr = messages.find((m) => m.rule === 'missing-ads-clause');
    expect(adErr).toBeDefined();
    expect(adErr?.type).toBe('error');
  });

  it('detects unresolved TODO placeholders', () => {
    const md = '## Privacy Notice\n\nContact TODO-insert-email for support.';
    const messages = lintLegalMarkdown(md, site, 'privacy');
    const todoWarn = messages.find((m) => m.rule === 'unresolved-placeholder');
    expect(todoWarn).toBeDefined();
    expect(todoWarn?.type).toBe('warning');
  });
});
