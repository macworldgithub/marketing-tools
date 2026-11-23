// GENERATED from _template — do not edit here
import React from 'react';
import { SiteConfig, FAQs } from '../content/types';

interface SEOMetadataProps {
  site: SiteConfig;
  faqs?: FAQs;
  isHome?: boolean;
}

export const SEOMetadata: React.FC<SEOMetadataProps> = ({ site, faqs, isHome = false }) => {
  const baseUrl = `https://${site.domain}`;

  const webAppSchema = isHome
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: site.siteName,
        url: baseUrl,
        description: site.tagline,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }
    : null;

  const faqPageSchema =
    faqs && faqs.items && faqs.items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.items.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      {webAppSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
      )}
      {faqPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      )}
    </>
  );
};

