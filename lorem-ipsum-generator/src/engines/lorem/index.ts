// GENERATED from _template — do not edit here
/**
 * Classic Latin Lorem Ipsum Generator
 */

export const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et',
  'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
  'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex',
  'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat',
  'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
  'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim',
  'id', 'est', 'laborum',
];

const CLASSIC_OPENING = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
];

export interface LoremOptions {
  type: 'paragraphs' | 'sentences' | 'words';
  count: number;
  startWithLorem?: boolean;
  asHtml?: boolean;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates an array of words
 */
function getWords(count: number, startIndex: number = 0): string[] {
  const result: string[] = [];
  const poolLen = LOREM_WORDS.length;
  for (let i = 0; i < count; i++) {
    result.push(LOREM_WORDS[(startIndex + i) % poolLen]);
  }
  return result;
}

/**
 * Generates a sentence of 5-15 words
 */
function generateSentence(targetWords: number, wordOffset: number): { sentence: string; wordsUsed: number } {
  const words = getWords(targetWords, wordOffset);
  if (words.length === 0) return { sentence: '', wordsUsed: 0 };

  // Comma inserted in sentences over 8 words
  if (words.length > 8) {
    const commaIndex = Math.min(words.length - 3, Math.max(3, Math.floor(words.length / 2)));
    words[commaIndex] = words[commaIndex] + ',';
  }

  const sentence = capitalize(words.join(' ')) + '.';
  return { sentence, wordsUsed: targetWords };
}

/**
 * Generates exact N words, formatted as sentences
 */
export function generateExactWords(count: number, startWithLorem: boolean = true): string {
  if (count <= 0) return '';
  const resultWords: string[] = [];

  let wordIndex = 0;
  if (startWithLorem) {
    const initialWords = CLASSIC_OPENING.slice(0, count);
    resultWords.push(...initialWords);
    wordIndex = initialWords.length;
  } else {
    wordIndex = 8;
  }

  while (resultWords.length < count) {
    resultWords.push(LOREM_WORDS[wordIndex % LOREM_WORDS.length]);
    wordIndex++;
  }

  // Format into capitalized sentences with period
  const chunks: string[] = [];
  let i = 0;
  while (i < resultWords.length) {
    const sentenceLen = Math.min(10, resultWords.length - i);
    const chunk = resultWords.slice(i, i + sentenceLen);
    if (chunk.length > 0) {
      chunk[0] = capitalize(chunk[0]);
      chunks.push(chunk.join(' '));
    }
    i += sentenceLen;
  }

  return chunks.join('. ') + '.';
}

/**
 * Main Lorem generator
 */
export function generateLorem(options: LoremOptions): string {
  const { type, count, startWithLorem = true, asHtml = false } = options;

  if (count <= 0) return '';

  if (type === 'words') {
    const text = generateExactWords(count, startWithLorem);
    return asHtml ? `<p>${text}</p>` : text;
  }

  if (type === 'sentences') {
    const sentences: string[] = [];
    let wordOffset = startWithLorem ? 0 : 8;

    for (let s = 0; s < count; s++) {
      if (s === 0 && startWithLorem) {
        sentences.push('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
        wordOffset += 8;
      } else {
        // Vary sentence length between 6 and 14 words deterministically
        const len = 6 + ((s * 3 + 1) % 9);
        const { sentence } = generateSentence(len, wordOffset);
        sentences.push(sentence);
        wordOffset += len;
      }
    }

    const text = sentences.join(' ');
    return asHtml ? `<p>${text}</p>` : text;
  }

  // Paragraphs mode (3-7 sentences per paragraph)
  const paragraphs: string[] = [];
  let wordOffset = startWithLorem ? 0 : 8;

  for (let p = 0; p < count; p++) {
    const sentencesInPara = 4 + ((p * 2) % 4); // 4 to 7 sentences
    const pSentences: string[] = [];

    for (let s = 0; s < sentencesInPara; s++) {
      if (p === 0 && s === 0 && startWithLorem) {
        pSentences.push('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
        wordOffset += 8;
      } else {
        const len = 7 + ((p + s * 4) % 8);
        const { sentence } = generateSentence(len, wordOffset);
        pSentences.push(sentence);
        wordOffset += len;
      }
    }

    paragraphs.push(pSentences.join(' '));
  }

  if (asHtml) {
    return paragraphs.map((p) => `<p>${p}</p>`).join('\n\n');
  }

  return paragraphs.join('\n\n');
}
