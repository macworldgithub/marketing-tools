'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSitesWithPendingChanges } from '../lib/store/pending';
import { clearVault, getInMemoryConfig } from '../lib/store/vault';
import {
  LayoutGrid,
  FileText,
  Layers,
  Settings,
  GitCommit,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [hasConnection, setHasConnection] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check dark mode
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }

    // Refresh pending count
    const refreshPending = async () => {
      try {
        const sites = await getSitesWithPendingChanges();
        setPendingCount(sites.length);
      } catch {}
    };
    refreshPending();

    // Check connection config
    setHasConnection(Boolean(getInMemoryConfig()?.token));

    const interval = setInterval(refreshPending, 2000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect from GitHub and forget token? Any unsaved edits in memory will be cleared.')) {
      await clearVault();
      window.location.href = '/settings/';
    }
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid },
    { href: '/baseline/', label: 'Baseline Templates', icon: FileText },
    { href: '/bulk/', label: 'Bulk Operations', icon: Layers },
    { href: '/settings/', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Desktop Links */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Sites Admin</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Pending Changes badge */}
          {pendingCount > 0 && (
            <Link
              href="/review/"
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold tracking-tight shadow-xs transition-all"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Review & Save ({pendingCount})</span>
              <span className="sm:hidden">Save ({pendingCount})</span>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Disconnect */}
          {hasConnection && (
            <button
              type="button"
              onClick={handleDisconnect}
              title="Disconnect / forget token"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
