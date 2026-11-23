import React from 'react';
import { MarkdownContent } from './MarkdownContent';

interface LegalRendererProps {
  title: string;
  html: string;
}

export const LegalRenderer: React.FC<LegalRendererProps> = ({ title, html }) => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          {title}
        </h1>
        <MarkdownContent html={html} />
      </div>
    </div>
  );
};

