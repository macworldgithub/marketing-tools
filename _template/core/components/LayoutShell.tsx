import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutShellProps {
  siteName: string;
  accent: string;
  children: React.ReactNode;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  siteName,
  accent,
  children,
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 theme-${accent}`}>
      <Header siteName={siteName} />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <Footer siteName={siteName} />
    </div>
  );
};

