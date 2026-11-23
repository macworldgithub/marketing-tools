'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  PreviewContentMessageSchema,
  PreviewThemeMessageSchema,
  PreviewContentMessage,
} from './types';
import { LayoutShell } from '../components/LayoutShell';
import { FAQAccordion } from '../components/FAQAccordion';
import { LegalRenderer } from '../components/LegalRenderer';
import { buildContextFromSite, renderLegalTemplate } from '../content/legal-template';
import { strictSanitizeSchema } from '../utils/sanitize';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

interface PreviewClientProps {
  initialSlug: string;
  adminOrigin?: string;
  ToolComponent?: React.ComponentType<{ isPreview?: boolean }>;
}

async function renderMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize, strictSanitizeSchema)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

export const PreviewClient: React.FC<PreviewClientProps> = ({
  initialSlug,
  adminOrigin = process.env.NEXT_PUBLIC_PREVIEW_ADMIN_ORIGIN || '',
  ToolComponent,
}) => {
  const [draft, setDraft] = useState<PreviewContentMessage | null>(null);
  const [legalHtml, setLegalHtml] = useState<string>('');
  const [faqAnswersHtml, setFaqAnswersHtml] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Send preview-ready on mount
  useEffect(() => {
    if (!adminOrigin || typeof window === 'undefined') return;

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { v: 1, type: 'preview-ready', slug: initialSlug },
        adminOrigin
      );
    }
  }, [adminOrigin, initialSlug]);

  // Handle incoming postMessage
  useEffect(() => {
    if (!adminOrigin || typeof window === 'undefined') return;

    const handleMessage = async (event: MessageEvent) => {
      // Security check: exact origin and parent window source
      if (event.origin !== adminOrigin || event.source !== window.parent) {
        return;
      }

      const data = event.data;
      if (!data || data.v !== 1) return;

      if (data.type === 'preview-theme') {
        const themeResult = PreviewThemeMessageSchema.safeParse(data);
        if (themeResult.success) {
          if (themeResult.data.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return;
      }

      if (data.type === 'preview-content') {
        const parseResult = PreviewContentMessageSchema.safeParse(data);
        if (!parseResult.success) {
          const schemaErrors = parseResult.error.issues.map(
            (i) => `${i.path.join('.')}: ${i.message}`
          );
          setErrors(schemaErrors);
          window.parent.postMessage(
            {
              v: 1,
              type: 'preview-rendered',
              ok: false,
              errors: schemaErrors,
              contentHeight: document.body.scrollHeight,
            },
            adminOrigin
          );
          return;
        }

        const content = parseResult.data;
        const caughtErrors: string[] = [];

        try {
          if (content.page === 'privacy' || content.page === 'terms') {
            if (content.legalMarkdown) {
              const context = buildContextFromSite(content.site);
              const templated = renderLegalTemplate(content.legalMarkdown, context);
              const html = await renderMarkdown(templated);
              setLegalHtml(html);
            }
          }

          if (content.faqs && content.faqs.items) {
            const htmlMap: Record<string, string> = {};
            for (const item of content.faqs.items) {
              htmlMap[item.id] = await renderMarkdown(item.answer);
            }
            setFaqAnswersHtml(htmlMap);
          }

          setDraft(content);
          setErrors([]);

          // Post success render
          setTimeout(() => {
            const height = document.body.scrollHeight;
            window.parent.postMessage(
              {
                v: 1,
                type: 'preview-rendered',
                ok: true,
                errors: [],
                contentHeight: height,
              },
              adminOrigin
            );

            // Handle focusId scrolling and outline
            if (content.focusId) {
              const el = document.getElementById(content.focusId);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }, 50);
        } catch (err: any) {
          caughtErrors.push(err.message || String(err));
          setErrors(caughtErrors);
          window.parent.postMessage(
            {
              v: 1,
              type: 'preview-rendered',
              ok: false,
              errors: caughtErrors,
              contentHeight: document.body.scrollHeight,
            },
            adminOrigin
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [adminOrigin]);

  // If no draft received yet, render neutral skeleton
  if (!draft) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
          <p className="text-center text-xs text-slate-500">Waiting for preview content from admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Slim unsaved draft banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 text-xs font-semibold py-1 px-4 text-center tracking-wide shadow-sm">
        Preview — unsaved draft
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 p-4 text-red-700 text-sm">
          <strong>Validation errors:</strong>
          <ul className="list-disc pl-5 mt-1">
            {errors.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <LayoutShell siteName={draft.site.siteName} accent={draft.site.accent}>
        {draft.page === 'home' && (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {draft.site.toolName}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                {draft.site.tagline}
              </p>
            </div>

            {ToolComponent && (
              <div className="max-w-[720px] mx-auto">
                <ToolComponent isPreview={true} />
              </div>
            )}

            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <FAQAccordion
                items={draft.faqs.items.slice(0, 5)}
                answersHtml={faqAnswersHtml}
                highlightId={draft.focusId}
              />
            </div>
          </div>
        )}

        {draft.page === 'faqs' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h1>
            <FAQAccordion
              items={draft.faqs.items}
              answersHtml={faqAnswersHtml}
              highlightId={draft.focusId}
            />
          </div>
        )}

        {(draft.page === 'privacy' || draft.page === 'terms') && (
          <LegalRenderer
            title={draft.page === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            html={legalHtml}
          />
        )}
      </LayoutShell>
    </div>
  );
};

