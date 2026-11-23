'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, RotateCw } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  siteName: string;
}

export const Header: React.FC<HeaderProps> = ({ siteName }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Wordmark (text only, siteName) */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-md p-2 min-h-[44px] inline-flex items-center"
        >
          {siteName}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link
            href="/"
            className="hover:text-slate-900 dark:hover:text-white p-2 min-h-[44px] flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-md"
          >
            Tool
          </Link>
          <Link
            href="/faqs/"
            className="hover:text-slate-900 dark:hover:text-white p-2 min-h-[44px] flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-md"
          >
            FAQs
          </Link>
          <Link
            href="/privacy/"
            className="hover:text-slate-900 dark:hover:text-white p-2 min-h-[44px] flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-md"
          >
            Privacy
          </Link>
          <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('tool:refresh'));
              }}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
              title="Refresh tool"
              aria-label="Refresh tool"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('tool:refresh'));
            }}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
            title="Refresh tool"
            aria-label="Refresh tool"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Tool
          </Link>
          <Link
            href="/faqs/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            FAQs
          </Link>
          <Link
            href="/privacy/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Privacy
          </Link>
        </div>
      )}
    </header>
  );
};

