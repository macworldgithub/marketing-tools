// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import {
  PreviewContentMessageSchema,
  PreviewThemeMessageSchema,
} from './types';

describe('Preview Protocol Schemas', () => {
  it('validates a correct preview-content message', () => {
    const validMessage = {
      v: 1,
      type: 'preview-content',
      page: 'faqs',
      site: {
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
      },
      faqs: {
        schemaVersion: 1,
        items: [
          {
            id: 'test-faq',
            question: 'What is BMI?',
            answer: 'Body mass index.',
          },
        ],
      },
      legalMarkdown: null,
      focusId: 'test-faq',
    };

    const result = PreviewContentMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it('rejects message with invalid version or missing fields', () => {
    const invalidMessage = {
      v: 2,
      type: 'preview-content',
    };
    const result = PreviewContentMessageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it('validates preview-theme message', () => {
    const themeMessage = {
      v: 1,
      type: 'preview-theme',
      theme: 'dark',
    };
    const result = PreviewThemeMessageSchema.safeParse(themeMessage);
    expect(result.success).toBe(true);
  });
});

