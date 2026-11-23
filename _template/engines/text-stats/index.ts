export interface TextStatsResult {
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeText: string;
  speakingTimeText: string;
  readingTimeSeconds: number;
  speakingTimeSeconds: number;
  topKeywords: { word: string; count: number; density: number }[];
}

const COMMON_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
]);

function formatTime(seconds: number): string {
  if (seconds <= 0) return '< 1 sec';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s} sec`;
  return `${m} min ${s} sec`;
}

export function analyzeText(text: string, options: { excludeStopWords?: boolean } = {}): TextStatsResult {
  const normalized = text.replace(/\r\n/g, '\n');

  if (!normalized) {
    return {
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeText: '< 1 sec',
      speakingTimeText: '< 1 sec',
      readingTimeSeconds: 0,
      speakingTimeSeconds: 0,
      topKeywords: [],
    };
  }

  // 1. Characters with spaces (Grapheme clusters)
  let graphemes: string[] = [];
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    for (const segment of segmenter.segment(normalized)) {
      graphemes.push(segment.segment);
    }
  } else {
    graphemes = Array.from(normalized);
  }
  const charactersWithSpaces = graphemes.length;

  // 2. Characters without spaces (excluding Unicode whitespace)
  const unicodeWhitespaceRegex = /\s/u;
  const charactersWithoutSpaces = graphemes.filter((g) => !unicodeWhitespaceRegex.test(g)).length;

  // 3. Words: whitespace-separated tokens that contain at least one \p{L} or \p{N}
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const letterOrNumberRegex = /[\p{L}\p{N}]/u;
  const wordTokens = rawTokens.filter((token) => letterOrNumberRegex.test(token));
  const words = wordTokens.length;

  // 4. Sentences: Intl.Segmenter with granularity 'sentence'
  let sentences = 0;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const sentenceSegmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    const segments: string[] = [];
    for (const segment of sentenceSegmenter.segment(normalized)) {
      if (segment.segment.trim().length > 0 && letterOrNumberRegex.test(segment.segment)) {
        segments.push(segment.segment.trim());
      }
    }
    // Rule: introductory greetings/interjections with < 3 words ending in ! or ? attach to the following sentence
    let count = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segWords = seg.split(/\s+/).filter((w) => letterOrNumberRegex.test(w)).length;
      if (segWords < 3 && i < segments.length - 1 && /[!?]$/.test(seg)) {
        continue;
      }
      count++;
    }
    sentences = count;
  } else {
    // Fallback: split on punctuation followed by space or end of string
    const match = normalized.match(/[^.!?]+[.!?]+(\s|$)/g);
    sentences = match ? match.length : (words > 0 ? 1 : 0);
  }
  if (sentences === 0 && words > 0) sentences = 1;

  // 5. Paragraphs: blocks separated by one or more blank lines
  const paragraphBlocks = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const paragraphs = paragraphBlocks.length;

  // 6. Lines: split by \n
  const lines = normalized.split('\n').length;

  // 7. Reading & Speaking Time
  const readingTimeSeconds = words > 0 ? (words / 238) * 60 : 0;
  const speakingTimeSeconds = words > 0 ? (words / 150) * 60 : 0;

  // 8. Keyword density
  const wordFrequency: Record<string, number> = {};
  for (const token of wordTokens) {
    const cleaned = token
      .toLowerCase()
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/[^\p{L}\p{N}]+$/u, '');

    if (!cleaned) continue;
    if (options.excludeStopWords && COMMON_STOP_WORDS.has(cleaned)) continue;

    wordFrequency[cleaned] = (wordFrequency[cleaned] || 0) + 1;
  }

  const sortedKeywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      density: words > 0 ? Number(((count / words) * 100).toFixed(1)) : 0,
    }));

  return {
    charactersWithSpaces,
    charactersWithoutSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTimeText: formatTime(readingTimeSeconds),
    speakingTimeText: formatTime(speakingTimeSeconds),
    readingTimeSeconds,
    speakingTimeSeconds,
    topKeywords: sortedKeywords,
  };
}

