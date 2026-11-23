import { MetadataRoute } from 'next';
import { loadSite } from '@/shared/content/loader';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = loadSite();
  const baseUrl = `https://${site.domain}`;

  // Routes per contract: /, /faqs/, /privacy/, /terms/, /about/, /contact/
  // Note: /preview/ is explicitly excluded
  const routes = [
    '',
    '/faqs/',
    '/privacy/',
    '/terms/',
    '/about/',
    '/contact/',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(site.effectiveDate),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));
}
