import type { Metadata, Viewport } from 'next';
import './globals.css';
import { loadSite } from '@/shared/content/loader';

export function generateMetadata(): Metadata {
  const site = loadSite();
  const url = `https://${site.domain}`;

  return {
    metadataBase: new URL(url),
    title: {
      default: `${site.siteName} — Free & Client-Side`,
      template: `%s | ${site.siteName}`,
    },
    description: site.tagline,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: site.siteName,
      description: site.tagline,
      url: '/',
      siteName: site.siteName,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: site.siteName,
      description: site.tagline,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#1D4ED8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-accent-primary/20">
        {children}
      </body>
    </html>
  );
}
