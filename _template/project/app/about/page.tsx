import { Metadata } from 'next';
import { loadSite } from '@/shared/content/loader';
import { LayoutShell } from '@/shared/components/LayoutShell';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: `About — ${site.siteName}`,
    description: `Learn more about ${site.siteName}, our mission, and our browser-only processing design.`,
    alternates: {
      canonical: '/about/',
    },
  };
}

export default function AboutPage() {
  const site = loadSite();

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about/' },
  ];

  return (
    <LayoutShell siteName={site.siteName} accent={site.accent}>
      <div className="max-w-3xl mx-auto py-6">
        <Breadcrumbs items={breadcrumbs} domain={site.domain} />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 shadow-sm space-y-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight pb-4 border-b border-slate-200 dark:border-slate-800">
            About {site.siteName}
          </h1>

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
            {site.siteName} is a focused, high-precision utility designed to provide fast, reliable results without compromising your privacy.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-2">
            Why Client-Side Only?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Most online utility websites transmit your personal metrics, files, or parameters across remote networks. We believe simple utilities should respect user confidentiality. Every formula, calculation, and document transformation in {site.toolName} runs 100% locally within your browser using modern WebAssembly and JavaScript standards.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-2">
            Our Guarantees
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
            <li><strong>Zero Remote Storage:</strong> None of your input data is logged or transmitted to our servers.</li>
            <li><strong>Mathematical Rigor:</strong> We use strict decimal precision arithmetic to eliminate floating-point rounding errors.</li>
            <li><strong>Fast & Responsive:</strong> Instant calculation feedback with no server roundtrips or artificial waiting.</li>
            <li><strong>Accessible Design:</strong> Fully keyboard navigable with clean, high-contrast typography.</li>
          </ul>
        </div>
      </div>
    </LayoutShell>
  );
}

