import React from 'react';
import Link from 'next/link';

interface FooterProps {
  siteName: string;
}

export const Footer: React.FC<FooterProps> = ({ siteName }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-10 mt-16 text-sm text-slate-600 dark:text-slate-400">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/faqs/"
              className="hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded p-1 min-h-[44px] flex items-center"
            >
              FAQs
            </Link>
            <Link
              href="/privacy/"
              className="hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded p-1 min-h-[44px] flex items-center"
            >
              Privacy
            </Link>
            <Link
              href="/terms/"
              className="hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded p-1 min-h-[44px] flex items-center"
            >
              Terms
            </Link>
            <Link
              href="/about/"
              className="hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded p-1 min-h-[44px] flex items-center"
            >
              About
            </Link>
            <Link
              href="/contact/"
              className="hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded p-1 min-h-[44px] flex items-center"
            >
              Contact
            </Link>
          </nav>

          <div className="text-center md:text-right text-xs text-slate-500 dark:text-slate-500">
            <p>© {currentYear} {siteName}. All processing occurs entirely in your browser.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

