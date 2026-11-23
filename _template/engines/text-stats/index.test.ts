import { describe, it, expect } from 'vitest';
import { analyzeText } from './index';

describe('Text Statistics Engine', () => {
  // Test Vector: "Hello, world! It's a well-known fact." → characters 37, no spaces 32, words 6, sentences 1.
  it('correctly calculates specification test vector', () => {
    const text = "Hello, world! It's a well-known fact.";
    const result = analyzeText(text);

    expect(result.charactersWithSpaces).toBe(37);
    expect(result.charactersWithoutSpaces).toBe(32);
    expect(result.words).toBe(6);
    expect(result.sentences).toBe(1);
  });

  it('normalizes CRLF line breaks to single LF', () => {
    const text = 'Line 1\r\nLine 2\r\n\r\nParagraph 2';
    const result = analyzeText(text);

    expect(result.paragraphs).toBe(2);
    expect(result.lines).toBe(4);
  });

  it('counts emoji as 1 grapheme character', () => {
    const text = 'Hello 👋 world! 🌍';
    const result = analyzeText(text);

    expect(result.words).toBe(2);
    // 'Hello ' (6) + '👋' (1) + ' ' (1) + 'world!' (6) + ' ' (1) + '🌍' (1) = 16
    expect(result.charactersWithSpaces).toBe(16);
  });

  it('calculates reading and speaking times', () => {
    // 238 words should take 1 min reading
    const words238 = Array(238).fill('sample').join(' ');
    const res = analyzeText(words238);

    expect(res.words).toBe(238);
    expect(res.readingTimeText).toBe('1 min 0 sec');
  });
});

