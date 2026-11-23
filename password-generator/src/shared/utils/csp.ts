// GENERATED from _template — do not edit here
import { SiteConfig } from '../content/types';

export function generateHeadersConfig(site: SiteConfig, adminOrigin?: string): string {
  const adminAllowedOrigin = adminOrigin || process.env.NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN || '';

  // Base Content-Security-Policy
  let connectSrc = "'self'";
  let scriptSrc = "'self' 'unsafe-inline'";

  if (site.features.analytics === 'plausible') {
    connectSrc += ' https://plausible.io';
    scriptSrc += ' https://plausible.io';
  }

  const standardCSP = [
    "default-src 'self'",
    `connect-src ${connectSrc}`,
    "img-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
  ].join('; ');

  const previewFrameAncestors = adminAllowedOrigin ? adminAllowedOrigin : "'none'";
  const previewCSP = [
    "default-src 'self'",
    `connect-src ${connectSrc}`,
    "img-src 'self' data: blob:",
    "worker-src 'self' blob:",
    `frame-ancestors ${previewFrameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
  ].join('; ');

  return `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: ${standardCSP}

/preview*
  ! X-Frame-Options
  ! Content-Security-Policy
  Content-Security-Policy: ${previewCSP}
  X-Robots-Tag: noindex
`;
}

