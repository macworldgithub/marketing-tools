import { Metadata } from 'next';
import { loadSite, renderLegal } from '@/shared/content/loader';
import { LayoutShell } from '@/shared/components/LayoutShell';
import { LegalRenderer } from '@/shared/components/LegalRenderer';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

export function generateMetadata(): Metadata {
  const site = loadSite();
  return {
    title: `Privacy Policy — ${site.siteName}`,
    description: `Privacy policy for ${site.siteName}. Learn how our client-side architecture keeps your calculations private.`,
    alternates: {
      canonical: '/privacy/',
    },
  };
}

export default async function PrivacyPage() {
  const site = loadSite();
  const { title, html } = await renderLegal('privacy');

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Privacy Policy', href: '/privacy/' },
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
