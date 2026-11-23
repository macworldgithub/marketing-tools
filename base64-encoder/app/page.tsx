import Link from 'next/link';
import { loadSite, loadFaqs, loadExplainer, markdownToHtml } from '@/shared/content/loader';
import { LayoutShell } from '@/shared/components/LayoutShell';
import { FAQAccordion } from '@/shared/components/FAQAccordion';
import { MarkdownContent } from '@/shared/components/MarkdownContent';
import { SEOMetadata } from '@/shared/components/SEOMetadata';
import { Tool } from '@/tool';

export default async function HomePage() {
  const site = loadSite();
  const faqs = loadFaqs();
  const explainerMd = loadExplainer();
  const explainerHtml = explainerMd ? await markdownToHtml(explainerMd) : '';

  // Pre-render answers for first 5 FAQs
  const topFaqs = faqs.items.slice(0, 5);
  const faqAnswersHtml: Record<string, string> = {};
  for (const item of topFaqs) {
    faqAnswersHtml[item.id] = await markdownToHtml(item.answer);
  }

  return (
    <LayoutShell siteName={site.siteName} accent={site.accent}>
      <SEOMetadata site={site} faqs={faqs} isHome={true} />
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 pt-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
          {site.toolName}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
          {site.tagline}
        </p>
      </div>

      {/* Primary Tool UI */}
      <section className="mb-16">
        <Tool />
      </section>

      {/* How It Works (Explainer) */}
      {explainerHtml && (
        <section className="max-w-3xl mx-auto mb-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            How It Works
          </h2>
          <MarkdownContent html={explainerHtml} />
        </section>
      )}

      {/* Top FAQs Section */}
      <section className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <Link
            href="/faqs/"
            className="text-sm font-semibold text-accent-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded p-2 min-h-[44px] inline-flex items-center"
          >
            See all FAQs &rarr;
          </Link>
        </div>
        <FAQAccordion items={topFaqs} answersHtml={faqAnswersHtml} />
      </section>

      {/* Related Info & Privacy Guarantee */}
      <section className="max-w-3xl mx-auto text-center py-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-500">
        <p>
          100% Client-Side Privacy: No data, files, or parameters are transmitted over the network. All operations run directly in your browser session.
        </p>
      </section>
    </LayoutShell>
  );
}

