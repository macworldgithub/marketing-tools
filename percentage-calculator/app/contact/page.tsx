import { Metadata } from 'next';
import { loadSite } from '@/shared/content/loader';
import { LayoutShell } from '@/shared/components/LayoutShell';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Mail } from 'lucide-react';

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: `Contact — ${site.siteName}`,
    description: `Get in touch with the maintainers of ${site.siteName}.`,
    alternates: {
      canonical: '/contact/',
    },
  };
}

export default function ContactPage() {
  const site = loadSite();

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Contact', href: '/contact/' },
  ];

  return (
    <LayoutShell siteName={site.siteName} accent={site.accent}>
      <div className="max-w-3xl mx-auto py-6">
        <Breadcrumbs items={breadcrumbs} domain={site.domain} />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 shadow-sm space-y-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight pb-4 border-b border-slate-200 dark:border-slate-800">
            Contact Us
          </h1>

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Have feedback, noticed an edge-case calculation, or have a question about {site.siteName}? We welcome constructive bug reports and inquiries.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Direct Inquiries</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{site.contactEmail}</p>
            </div>
            <a
              href={`mailto:${site.contactEmail}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </a>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Notice: To maintain strict privacy standards, this website operates with no backend server or database; contact submissions are handled exclusively through your local email client.
          </p>
        </div>
      </div>
    </LayoutShell>
  );
}

