import { SiteConfig, FaqsData } from './types';

/**
 * Serializes SiteConfig into JSON with 2-space indentation, trailing newline,
 * and stable, deterministic key order.
 */
export function serializeSite(site: SiteConfig): string {
  const ordered = {
    schemaVersion: site.schemaVersion,
    slug: site.slug,
    siteName: site.siteName,
    toolName: site.toolName,
    primaryKeyword: site.primaryKeyword,
    domain: site.domain,
    tagline: site.tagline,
    contactEmail: site.contactEmail,
    accent: site.accent,
    effectiveDate: site.effectiveDate,
    features: {
      ads: Boolean(site.features?.ads),
      analytics: site.features?.analytics ?? 'none',
      localStorageKeys: Array.isArray(site.features?.localStorageKeys) ? site.features.localStorageKeys : [],
    },
  };
  return JSON.stringify(ordered, null, 2) + '\n';
}

/**
 * Serializes FaqsData into JSON with 2-space indentation, trailing newline,
 * and stable key order.
 */
export function serializeFaqs(faqs: FaqsData): string {
  const ordered = {
    schemaVersion: faqs.schemaVersion,
    items: faqs.items.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
  };
  return JSON.stringify(ordered, null, 2) + '\n';
}

/**
 * Normalizes Markdown text to enforce Unix LF line endings and a trailing newline.
 */
export function serializeMarkdown(md: string): string {
  const normalized = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
  return normalized ? normalized + '\n' : '';
}

