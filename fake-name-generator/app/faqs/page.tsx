import { Metadata } from 'next';
import { loadSite, loadFaqs, markdownToHtml } from '@/shared/content/loader';
import { LayoutShell } from '@/shared/components/LayoutShell';
import { FAQAccordion } from '@/shared/components/FAQAccordion';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { SEOMetadata } from '@/shared/components/SEOMetadata';

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: `Frequently Asked Questions — ${site.siteName}`,
    description: `Answers to frequently asked questions about ${site.toolName}, formula details, accuracy, and client-side processing.`,
    alternates: {
      canonical: '/faqs/',
    },
  };
}

export default async function FAQsPage() {
  const site = loadSite();
  const faqs = loadFaqs();

  const answersHtml: Record<string, string> = {};
  for (const item of faqs.items) {
    answersHtml[item.id] = await markdownToHtml(item.answer);
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'FAQs', href: '/faqs/' },
  ];

  return (
    <LayoutShell siteName={site.siteName} accent={site.accent}>
      <SEOMetadata site={site} faqs={faqs} />
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={breadcrumbs} domain={site.domain} />
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Detailed guidance, mathematical methodology, privacy guarantees, and answers for common questions regarding {site.toolName}.
        </p>
        <FAQAccordion items={faqs.items} answersHtml={answersHtml} />
      </div>
    </LayoutShell>
  );
}

