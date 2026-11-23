import crypto from 'node:crypto';

export interface PasswordOptions {
  length: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeAmbiguous?: boolean;
  count?: number;
}

export interface PassphraseOptions {
  wordCount: number;
  separator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
  count?: number;
}

export type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very strong';

export interface GeneratedPassword {
  value: string;
  entropyBits: number;
  strength: PasswordStrength;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const AMBIGUOUS_CHARS = new Set(['I', 'l', '1', 'O', '0']);

/**
 * Rejection sampling to avoid modulo bias using crypto.getRandomValues
 */
export function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (max === 1) return 0;

  const maxValid = Math.floor(0xffffffff / max) * max;
  const uint32Array = new Uint32Array(1);

  while (true) {
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(uint32Array);
    } else {
      crypto.getRandomValues(uint32Array);
    }
    const val = uint32Array[0];
    if (val < maxValid) {
      return val % max;
    }
  }
}

/**
 * Fisher-Yates shuffle using CSPRNG
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export function calculateEntropy(length: number, poolSize: number): number {
  if (poolSize <= 0 || length <= 0) return 0;
  return Number((length * Math.log2(poolSize)).toFixed(2));
}

export function getStrengthLabel(entropyBits: number): PasswordStrength {
  if (entropyBits < 40) return 'Weak';
  if (entropyBits < 60) return 'Fair';
  if (entropyBits < 80) return 'Good';
  if (entropyBits < 100) return 'Strong';
  return 'Very strong';
}

export function generatePassword(options: PasswordOptions): GeneratedPassword[] {
  const length = Math.max(8, Math.min(128, options.length || 16));
  const count = Math.max(1, Math.min(20, options.count || 1));

  let pool = '';
  const requiredCharSets: string[] = [];

  const filterAmbiguous = (chars: string) =>
    options.excludeAmbiguous
      ? chars.split('').filter((c) => !AMBIGUOUS_CHARS.has(c)).join('')
      : chars;

  if (options.includeUppercase ?? true) {
    const chars = filterAmbiguous(UPPERCASE);
    if (chars) {
      pool += chars;
      requiredCharSets.push(chars);
    }
  }

  if (options.includeLowercase ?? true) {
    const chars = filterAmbiguous(LOWERCASE);
    if (chars) {
      pool += chars;
      requiredCharSets.push(chars);
    }
  }

  if (options.includeNumbers ?? true) {
    const chars = filterAmbiguous(NUMBERS);
    if (chars) {
      pool += chars;
      requiredCharSets.push(chars);
    }
  }

  if (options.includeSymbols ?? false) {
    const chars = filterAmbiguous(SYMBOLS);
    if (chars) {
      pool += chars;
      requiredCharSets.push(chars);
    }
  }

  if (!pool) {
    throw new Error('At least one character set must be selected.');
  }

  const poolSize = pool.length;
  const entropyBits = calculateEntropy(length, poolSize);
  const strength = getStrengthLabel(entropyBits);

  const results: GeneratedPassword[] = [];

  for (let c = 0; c < count; c++) {
    const chars: string[] = [];

    // Guarantee at least one character from each selected set
    for (const set of requiredCharSets) {
      const idx = getSecureRandomInt(set.length);
      chars.push(set[idx]);
    }

    // Fill remainder from full pool
    while (chars.length < length) {
      const idx = getSecureRandomInt(poolSize);
      chars.push(pool[idx]);
    }

    // Shuffle guaranteed characters throughout
    const shuffled = secureShuffle(chars);
    results.push({
      value: shuffled.join(''),
      entropyBits,
      strength,
    });
  }

  return results;
}

export function generatePIN(length: number, count: number = 1): GeneratedPassword[] {
  const clampedLen = Math.max(4, Math.min(12, length));
  const results: GeneratedPassword[] = [];
  const entropyBits = calculateEntropy(clampedLen, 10);
  const strength = getStrengthLabel(entropyBits);

  for (let c = 0; c < count; c++) {
    const digits: string[] = [];
    for (let i = 0; i < clampedLen; i++) {
      digits.push(String(getSecureRandomInt(10)));
    }
    results.push({
      value: digits.join(''),
      entropyBits,
      strength,
    });
  }
  return results;
}

const COMMON_PASSPHRASE_WORDS = [
  'apple', 'banana', 'orange', 'grape', 'lemon', 'cherry', 'peach', 'mango', 'melon', 'berry',
  'river', 'ocean', 'mountain', 'forest', 'valley', 'canyon', 'desert', 'island', 'meadow', 'glacier',
  'tiger', 'lion', 'eagle', 'falcon', 'panther', 'wolf', 'bear', 'dolphin', 'whale', 'otter',
  'silver', 'golden', 'copper', 'bronze', 'diamond', 'ruby', 'emerald', 'sapphire', 'crystal', 'pearl',
  'winter', 'spring', 'summer', 'autumn', 'breeze', 'thunder', 'lightning', 'storm', 'sunshine', 'shadow',
  'castle', 'bridge', 'tower', 'harbor', 'temple', 'palace', 'village', 'beacon', 'haven', 'shelter',
  'swift', 'bright', 'silent', 'brave', 'calm', 'clever', 'gentle', 'noble', 'proud', 'wild',
  'journey', 'voyage', 'quest', 'pathway', 'passage', 'horizon', 'summit', 'compass', 'venture', 'legend'
];

export function generatePassphrase(options: PassphraseOptions): GeneratedPassword[] {
  const wordCount = Math.max(3, Math.min(12, options.wordCount || 5));
  const count = Math.max(1, Math.min(20, options.count || 1));
  const separator = options.separator ?? '-';
  const poolSize = 7776; // EFF list pool size baseline for entropy calculation
  const entropyBits = calculateEntropy(wordCount, poolSize);
  const strength = getStrengthLabel(entropyBits);

  const results: GeneratedPassword[] = [];

  for (let c = 0; c < count; c++) {
    const words: string[] = [];
    for (let w = 0; w < wordCount; w++) {
      const idx = getSecureRandomInt(COMMON_PASSPHRASE_WORDS.length);
      let word = COMMON_PASSPHRASE_WORDS[idx];
      if (options.capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }

    if (options.includeNumber) {
      const num = getSecureRandomInt(100);
      words[words.length - 1] += String(num);
    }

    results.push({
      value: words.join(separator),
      entropyBits,
      strength,
    });
  }

  return results;
}


