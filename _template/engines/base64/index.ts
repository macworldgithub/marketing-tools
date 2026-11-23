/**
 * UTF-8 safe Base64 Encoder / Decoder conforming to RFC 4648
 */

export interface Base64EncodeOptions {
  urlSafe?: boolean;
  lineWrap?: number; // e.g. 76 for MIME
}

export interface Base64DecodeOptions {
  urlSafe?: boolean;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encodes a Uint8Array into a Base64 string
 */
export function bytesToBase64(bytes: Uint8Array, options: Base64EncodeOptions = {}): string {
  let base64 = '';
  const len = bytes.length;
  const extraBytes = len % 3;
  const mainLen = len - extraBytes;

  // Process 3 bytes at a time
  for (let i = 0; i < mainLen; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    base64 +=
      BASE64_CHARS[(chunk >> 18) & 63] +
      BASE64_CHARS[(chunk >> 12) & 63] +
      BASE64_CHARS[(chunk >> 6) & 63] +
      BASE64_CHARS[chunk & 63];
  }

  // Padding
  if (extraBytes === 1) {
    const chunk = bytes[mainLen] << 16;
    base64 += BASE64_CHARS[(chunk >> 18) & 63] + BASE64_CHARS[(chunk >> 12) & 63] + '==';
  } else if (extraBytes === 2) {
    const chunk = (bytes[mainLen] << 16) | (bytes[mainLen + 1] << 8);
    base64 +=
      BASE64_CHARS[(chunk >> 18) & 63] +
      BASE64_CHARS[(chunk >> 12) & 63] +
      BASE64_CHARS[(chunk >> 6) & 63] +
      '=';
  }

  // URL-Safe variant: + -> -, / -> _, strip =
  if (options.urlSafe) {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // MIME line wrap
  if (options.lineWrap && options.lineWrap > 0) {
    const lines: string[] = [];
    for (let i = 0; i < base64.length; i += options.lineWrap) {
      lines.push(base64.slice(i, i + options.lineWrap));
    }
    base64 = lines.join('\r\n');
  }

  return base64;
}

/**
 * Encodes a UTF-8 string to Base64
 */
export function encodeBase64(str: string, options: Base64EncodeOptions = {}): string {
  if (!str) return '';
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return bytesToBase64(bytes, options);
}

/**
 * Decodes a Base64 string into a Uint8Array
 */
export function base64ToBytes(input: string): Uint8Array {
  // Strip whitespace and newlines
  let cleaned = input.replace(/\s+/g, '');

  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }

  // Normalize URL-safe characters
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

  // Add missing padding
  const padLen = (4 - (cleaned.length % 4)) % 4;
  cleaned += '='.repeat(padLen);

  // Validate characters
  const invalidCharMatch = cleaned.match(/[^A-Za-z0-9+/=]/);
  if (invalidCharMatch) {
    throw new Error(`Invalid Base64 character '${invalidCharMatch[0]}' at position ${invalidCharMatch.index}`);
  }

  const len = cleaned.length;
  let placeHolders = 0;
  if (cleaned[len - 1] === '=') placeHolders++;
  if (cleaned[len - 2] === '=') placeHolders++;

  const byteLength = (len * 3) / 4 - placeHolders;
  const bytes = new Uint8Array(byteLength);

  const charMap: Record<string, number> = {};
  for (let i = 0; i < BASE64_CHARS.length; i++) {
    charMap[BASE64_CHARS[i]] = i;
  }

  let byteIdx = 0;
  for (let i = 0; i < len; i += 4) {
    const b0 = charMap[cleaned[i]];
    const b1 = charMap[cleaned[i + 1]];
    const b2 = cleaned[i + 2] === '=' ? 0 : charMap[cleaned[i + 2]];
    const b3 = cleaned[i + 3] === '=' ? 0 : charMap[cleaned[i + 3]];

    if (b0 === undefined || b1 === undefined) {
      throw new Error(`Malformed Base64 sequence at position ${i}`);
    }

    const chunk = (b0 << 18) | (b1 << 12) | (b2 << 6) | b3;

    bytes[byteIdx++] = (chunk >> 16) & 255;
    if (cleaned[i + 2] !== '=') {
      bytes[byteIdx++] = (chunk >> 8) & 255;
    }
    if (cleaned[i + 3] !== '=') {
      bytes[byteIdx++] = chunk & 255;
    }
  }

  return bytes;
}

/**
 * Decodes a Base64 string to a UTF-8 string
 */
export function decodeBase64(input: string): string {
  if (!input || input.trim().length === 0) return '';
  const bytes = base64ToBytes(input);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  return decoder.decode(bytes);
}
