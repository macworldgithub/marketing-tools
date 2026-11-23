// GENERATED from _template — do not edit here
import { defaultSchema } from 'rehype-sanitize';
import type { Options } from 'rehype-sanitize';

/**
 * Strict sanitization schema for rehype-sanitize.
 * Disallows raw HTML and embeds.
 * Permitted: h2, h3, p, ul, ol, li, strong, b, em, i, a, code, blockquote.
 */
export const strictSanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [
    'h2',
    'h3',
    'p',
    'ul',
    'ol',
    'li',
    'strong',
    'b',
    'em',
    'i',
    'a',
    'code',
    'blockquote',
    'hr',
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'target', 'rel', 'title'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
};

