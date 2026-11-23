import { MetadataRoute } from 'next';
import { loadSite } from '@/shared/content/loader';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const site = loadSite();
  const baseUrl = `https://${site.domain}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/preview/', '/preview/*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

