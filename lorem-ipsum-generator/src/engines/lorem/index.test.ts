// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateLorem, generateExactWords, LOREM_WORDS } from './index';

describe('Lorem Ipsum Generator Engine', () => {
  it('starts with classic phrase by default', () => {
    const text = generateLorem({ type: 'paragraphs', count: 1, startWithLorem: true });
    expect(text.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')).toBe(true);
  });

  it('can disable starting with classic phrase', () => {
    const text = generateLorem({ type: 'paragraphs', count: 1, startWithLorem: false });
    expect(text.startsWith('Lorem ipsum dolor sit amet')).toBe(false);
  });

  it('formats as HTML paragraphs when requested', () => {
    const html = generateLorem({ type: 'paragraphs', count: 2, asHtml: true });
    expect(html).toContain('<p>');
    expect(html).toContain('</p>');
    const matches = html.match(/<p>/g);
    expect(matches?.length).toBe(2);
  });

  it('generates exact number of words for specified count', () => {
    for (const count of [1, 5, 10, 25, 50, 100, 238]) {
      const text = generateLorem({ type: 'words', count });
      // Count whitespace separated words
      const words = text.split(/\s+/).filter(Boolean).length;
      expect(words).toBe(count);
    }
  });

  // Specification requirement: "N words" must yield exactly N words. Property test for N = 1..500.
  it('satisfies property test that N words yields exactly N words for any N between 1 and 500', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), (n) => {
        const text = generateExactWords(n, true);
        const words = text.split(/\s+/).filter(Boolean).length;
        return words === n;
      })
    );
  });
});
