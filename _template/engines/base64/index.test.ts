import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { encodeBase64, decodeBase64, bytesToBase64, base64ToBytes } from './index';

describe('Base64 Engine', () => {
  // Test vectors from RFC 4648 and specification
  it('correctly encodes RFC 4648 test vectors', () => {
    expect(encodeBase64('')).toBe('');
    expect(encodeBase64('f')).toBe('Zg==');
    expect(encodeBase64('fo')).toBe('Zm8=');
    expect(encodeBase64('foo')).toBe('Zm9v');
    expect(encodeBase64('foob')).toBe('Zm9vYg==');
    expect(encodeBase64('fooba')).toBe('Zm9vYmE=');
    expect(encodeBase64('foobar')).toBe('Zm9vYmFy');
    expect(encodeBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==');
    expect(encodeBase64('héllo ✓')).toBe('aMOpbGxvIOKckw==');
  });

  it('correctly decodes RFC 4648 test vectors', () => {
    expect(decodeBase64('')).toBe('');
    expect(decodeBase64('Zg==')).toBe('f');
    expect(decodeBase64('Zm8=')).toBe('fo');
    expect(decodeBase64('Zm9v')).toBe('foo');
    expect(decodeBase64('Zm9vYg==')).toBe('foob');
    expect(decodeBase64('Zm9vYmE=')).toBe('fooba');
    expect(decodeBase64('Zm9vYmFy')).toBe('foobar');
    expect(decodeBase64('SGVsbG8sIFdvcmxkIQ==')).toBe('Hello, World!');
    expect(decodeBase64('aMOpbGxvIOKckw==')).toBe('héllo ✓');
  });

  it('supports URL-safe base64 encoding and decoding without padding', () => {
    const text = 'subjects?_d=1&test=true';
    const standard = encodeBase64(text);
    const urlSafe = encodeBase64(text, { urlSafe: true });

    expect(urlSafe).not.toContain('+');
    expect(urlSafe).not.toContain('/');
    expect(urlSafe).not.toContain('=');

    // Decode url-safe back
    expect(decodeBase64(urlSafe)).toBe(text);
  });

  it('handles MIME line wrap', () => {
    const longText = 'A'.repeat(100);
    const wrapped = encodeBase64(longText, { lineWrap: 76 });
    const lines = wrapped.split('\r\n');
    expect(lines[0].length).toBe(76);
    expect(decodeBase64(wrapped)).toBe(longText);
  });

  it('throws informative error on invalid base64 characters', () => {
    expect(() => decodeBase64('Invalid!@#')).toThrow(/Invalid Base64 character/);
  });

  it('satisfies roundtrip property test decode(encode(x)) === x for arbitrary unicode strings', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const encoded = encodeBase64(str);
        const decoded = decodeBase64(encoded);
        return decoded === str;
      })
    );
  });

  it('satisfies roundtrip property test for arbitrary uint8 byte arrays', () => {
    fc.assert(
      fc.property(fc.uint8Array(), (bytes) => {
        const encoded = bytesToBase64(bytes);
        const decoded = base64ToBytes(encoded);
        if (bytes.length !== decoded.length) return false;
        for (let i = 0; i < bytes.length; i++) {
          if (bytes[i] !== decoded[i]) return false;
        }
        return true;
      })
    );
  });
});
