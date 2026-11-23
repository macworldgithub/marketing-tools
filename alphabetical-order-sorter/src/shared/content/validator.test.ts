// GENERATED from _template — do not edit here
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { validateContent } from './validator';

describe('validateContent', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validator-test-'));
    fs.mkdirSync(path.join(tempDir, 'content'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('fails when content files are missing', () => {
    const result = validateContent(tempDir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.file === 'site.json')).toBe(true);
  });

  it('passes when valid site.json, faqs.json, explainer.md, privacy.md, and terms.md are present', () => {
    const contentDir = path.join(tempDir, 'content');
    fs.writeFileSync(
      path.join(contentDir, 'site.json'),
      JSON.stringify({
        schemaVersion: 1,
        slug: 'test-tool',
        siteName: 'Test Tool',
        toolName: 'Test Tool',
        primaryKeyword: 'test tool',
        domain: 'example.com',
        tagline: 'A tool for testing.',
        contactEmail: 'contact@example.com',
        accent: 'blue',
        effectiveDate: '2026-11-23',
        features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
      })
    );

    fs.writeFileSync(
      path.join(contentDir, 'faqs.json'),
      JSON.stringify({
        schemaVersion: 1,
        items: [
          { id: 'q1', question: 'What is this?', answer: 'A test utility.' },
          { id: 'q2', question: 'How does it work?', answer: 'In the browser.' },
        ],
      })
    );

    fs.writeFileSync(
      path.join(contentDir, 'explainer.md'),
      'This tool processes everything client side with high precision and complete privacy for users everywhere.'
    );

    fs.writeFileSync(
      path.join(contentDir, 'privacy.md'),
      '# Privacy Policy for {{siteName}}\n{{#if localStorage}}Storage: {{localStorageKeys}}{{/if}}'
    );

    fs.writeFileSync(
      path.join(contentDir, 'terms.md'),
      '# Terms for {{siteName}} on {{domain}}'
    );

    const result = validateContent(tempDir);
    expect(result.valid).toBe(true);
  });
});

