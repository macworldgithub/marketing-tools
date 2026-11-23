import { z } from 'zod';

export const AccentColorSchema = z.enum(['blue', 'teal', 'indigo', 'emerald', 'slate']);
export type AccentColor = z.infer<typeof AccentColorSchema>;

export const AnalyticsTypeSchema = z.enum(['none', 'plausible', 'ga4']);
export type AnalyticsType = z.infer<typeof AnalyticsTypeSchema>;

export const SiteFeaturesSchema = z.object({
  ads: z.boolean().default(false),
  analytics: AnalyticsTypeSchema.default('none'),
  localStorageKeys: z.array(z.string()).default(['theme']),
});
export type SiteFeatures = z.infer<typeof SiteFeaturesSchema>;

export const SiteConfigSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  siteName: z.string().min(1),
  toolName: z.string().min(1),
  primaryKeyword: z.string().min(1),
  domain: z.string().min(1),
  tagline: z.string().min(1),
  contactEmail: z.string().min(1),
  accent: AccentColorSchema,
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  features: SiteFeaturesSchema,
});
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export const FAQItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  question: z.string().min(1).max(160),
  answer: z.string().min(1).max(2000),
});
export type FAQItem = z.infer<typeof FAQItemSchema>;

export const FAQsSchema = z.object({
  schemaVersion: z.literal(1),
  items: z.array(FAQItemSchema).min(1).max(40),
});
export type FAQs = z.infer<typeof FAQsSchema>;

