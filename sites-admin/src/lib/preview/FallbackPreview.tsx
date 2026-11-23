import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { SiteConfig, FaqsData } from '../content/types';
import { buildContextFromSite, renderLegalTemplate } from '../content/legal-template';
import { PreviewPageType } from './types';
import { AlertTriangle } from 'lucide-react';

interface FallbackPreviewProps {
  page: PreviewPageType;
  site: SiteConfig;
  faqs: FaqsData;
  legalMarkdown?: string | null;
  focusId?: string;
  theme: 'light' | 'dark';
}

export const FallbackPreview: React.FC<FallbackPreviewProps> = ({
  page,
  site,
  faqs,
  legalMarkdown,
  focusId,
  theme,
}) => {
  // Render legal template with context if on privacy or terms page
  let renderedLegal = '';
  let templateError: string | null = null;
  if (page === 'privacy' || page === 'terms') {
    try {
      const context = buildContextFromSite(site);
      renderedLegal = renderLegalTemplate(legalMarkdown || '', context);
    } catch (err: any) {
      templateError = err.message || 'Template rendering failed';
    }
  }

  const isDark = theme === 'dark';

  return (
    <div className={`w-full min-h-full flex flex-col font-sans ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Banner explicitly indicating approximate fallback */}
      <div className="bg-amber-100 dark:bg-amber-950/80 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs px-4 py-2 flex items-center justify-center gap-2 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>Approximate preview — the live site preview is not reachable.</span>
      </div>

      <div className="max-w-3xl w-full mx-auto px-4 py-8 flex-1">
        {/* Header simulation */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">{site.siteName}</div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {page.toUpperCase()}
          </span>
        </div>

        {/* Page Content */}
        {page === 'home' && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <h1 className="text-3xl font-extrabold mb-2">{site.toolName}</h1>
              <p className="text-slate-600 dark:text-slate-400">{site.tagline}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
              [ Tool UI Component Interactive Area ]
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.items.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    id={f.id}
                    className={`p-4 rounded-lg border bg-white dark:bg-slate-900 ${
                      focusId === f.id
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-semibold mb-1">{f.question}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 prose dark:prose-invert max-w-none">
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{f.answer}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 'faqs' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
            <div className="space-y-3">
              {faqs.items.map((f) => (
                <div
                  key={f.id}
                  id={f.id}
                  className={`p-4 rounded-lg border bg-white dark:bg-slate-900 transition-all ${
                    focusId === f.id
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="font-semibold text-base mb-1.5">{f.question}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 prose dark:prose-invert max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{f.answer}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(page === 'privacy' || page === 'terms') && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800">
            <h1 className="text-2xl font-bold mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              {page === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h1>
            {templateError ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-sm">
                <strong>Template Syntax Error:</strong> {templateError}
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{renderedLegal}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

