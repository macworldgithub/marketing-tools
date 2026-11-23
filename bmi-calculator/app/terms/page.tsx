import { Metadata } from 'next';
import { loadSite, renderLegal } from '@/shared/content/loader';
import { LayoutShell } from '@/shared/components/LayoutShell';
import { LegalRenderer } from '@/shared/components/LegalRenderer';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: `Terms of Service — ${site.siteName}`,
    description: `Terms of service governing the usage of ${site.siteName}.`,
    alternates: {
      canonical: '/terms/',
    },
  };
}

export default async function TermsPage() {
  const site = loadSite();
  const { title, html } = await renderLegal('terms');

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Terms of Service', href: '/terms/' },
  ];

  return (
    <LayoutShell siteName={site.siteName} accent={site.accent}>
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={breadcrumbs} domain={site.domain} />
        <LegalRenderer title={title} html={html} />
      </div>
    </LayoutShell>
  );
}
