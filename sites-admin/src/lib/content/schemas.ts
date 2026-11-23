import { z } from 'zod';

export const AccentColorSchema = z.enum(['blue', 'teal', 'indigo', 'emerald', 'slate']);
export const AnalyticsSchema = z.enum(['none', 'plausible', 'ga4']);

export const SiteSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  siteName: z.string().min(1).max(100),
  toolName: z.string().min(1).max(100),
  primaryKeyword: z.string().min(1).max(100),
  domain: z.string().min(1),
  tagline: z.string().min(1).max(250),
  contactEmail: z.string().email(),
  accent: AccentColorSchema,
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  features: z.object({
    ads: z.boolean(),
    analytics: AnalyticsSchema,
    localStorageKeys: z.array(z.string()),
  }),
});

// HTML tag detection regex for markdown answer sanitization
const HTML_TAG_REGEX = /<[a-z/][\s\S]*?>/i;

export const FaqItemSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Must be kebab-case (e.g. how-it-works)'),
  question: z.string().min(1, 'Question cannot be empty').max(160, 'Question must be 160 characters or less'),
  answer: z
    .string()
    .min(1, 'Answer cannot be empty')
    .max(2000, 'Answer must be 2000 characters or less')
    .refine((val) => !HTML_TAG_REGEX.test(val), {
      message: 'Raw HTML tags are forbidden in FAQ answers. Use standard Markdown instead.',
    }),
});

export const FaqsSchema = z
  .object({
    schemaVersion: z.literal(1),
    items: z.array(FaqItemSchema).min(1, 'Must have at least 1 FAQ').max(40, 'Maximum 40 FAQs allowed'),
  })
  .refine(
    (data) => {
      const ids = data.items.map((item) => item.id);
      return new Set(ids).size === ids.length;
    },
    {
      message: 'FAQ item IDs must be unique within the file',
      path: ['items'],
    }
  );

