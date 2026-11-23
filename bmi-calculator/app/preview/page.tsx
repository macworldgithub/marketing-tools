import { notFound } from 'next/navigation';
import { loadSite } from '@/shared/content/loader';
import { PreviewClient } from '@/shared/preview/PreviewClient';
import { Tool } from '@/tool';

export default function PreviewPage() {
  const adminOrigin = process.env.NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN;

  if (!adminOrigin) {
    notFound();
  }

  const site = loadSite();

  return (
    <PreviewClient
      initialSlug={site.slug}
      adminOrigin={adminOrigin}
      ToolComponent={Tool}
    />
  );
}
