'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SiteConfig, FaqsData } from '../content/types';
import {
  PreviewPageType,
  PreviewContentMessage,
  PreviewRenderedMessageSchema,
  PreviewReadyMessageSchema,
} from './types';
import { FallbackPreview } from './FallbackPreview';
import {
  Smartphone,
  Tablet,
  Monitor,
  Sun,
  Moon,
  RotateCw,
  ExternalLink,
  SplitSquareVertical,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import PORTS_MAP from '../ports.json';

interface LivePreviewProps {
  site: SiteConfig;
  faqs: FaqsData;
  legalMarkdown?: string | null;
  activePage: PreviewPageType;
  focusId?: string;
  onPageChange?: (page: PreviewPageType) => void;
  onRendererErrors?: (errors: string[]) => void;
}

type DeviceWidth = 390 | 768 | 1280;
type PreviewStatus = 'connecting' | 'live' | 'fallback';

export const LivePreview: React.FC<LivePreviewProps> = ({
  site,
  faqs,
  legalMarkdown,
  activePage,
  focusId,
  onPageChange,
  onRendererErrors,
}) => {
  const [deviceWidth, setDeviceWidth] = useState<DeviceWidth>(768);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [diffMode, setDiffMode] = useState<boolean>(false);
  const [status, setStatus] = useState<PreviewStatus>('connecting');
  const [contentHeight, setContentHeight] = useState<number>(800);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [previewBaseUrl, setPreviewBaseUrl] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load preview base URL override from localStorage or assigned port mapping or domain
  useEffect(() => {
    const override = localStorage.getItem(`preview_override_${site.slug}`);
    const assignedPort = (PORTS_MAP as Record<string, number>)[site.slug];

    if (override) {
      setPreviewBaseUrl(override);
    } else if (site.domain && !site.domain.includes('TODO')) {
      setPreviewBaseUrl(`https://${site.domain}`);
    } else if (assignedPort) {
      // Automatic local fallback to assigned dedicated port in 1500-1550 range
      setPreviewBaseUrl(`http://localhost:${assignedPort}`);
    } else {
      setPreviewBaseUrl('');
      setStatus('fallback'); // No valid domain or port configured
    }
  }, [site.slug, site.domain]);

  const targetOrigin = previewBaseUrl ? new URL(previewBaseUrl, window.location.href).origin : '';

  // Function to send current draft payload to iframe
  const sendDraftPayload = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !targetOrigin || status === 'fallback') return;

    const payload: PreviewContentMessage = {
      v: 1,
      type: 'preview-content',
      page: activePage,
      site,
      faqs,
      legalMarkdown: legalMarkdown || null,
      focusId,
      changedIds: diffMode ? faqs.items.map((i) => i.id) : undefined,
    };

    try {
      iframeRef.current.contentWindow.postMessage(payload, targetOrigin);
    } catch {}
  }, [activePage, site, faqs, legalMarkdown, focusId, diffMode, targetOrigin, status]);

  // Debounce draft updates by 250ms
  useEffect(() => {
    if (status === 'live') {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        sendDraftPayload();
      }, 250);
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [sendDraftPayload, status]);

  // Send theme toggle
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !targetOrigin || status !== 'live') return;
    try {
      iframeRef.current.contentWindow.postMessage(
        { v: 1, type: 'preview-theme', theme },
        targetOrigin
      );
    } catch {}
  }, [theme, targetOrigin, status]);

  // Handle incoming postMessage from iframe
  useEffect(() => {
    if (!targetOrigin) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== targetOrigin || event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data || data.v !== 1) return;

      // Handle preview-ready
      if (data.type === 'preview-ready') {
        const readyResult = PreviewReadyMessageSchema.safeParse(data);
        if (readyResult.success) {
          if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
          setStatus('live');
          sendDraftPayload();
        }
      }

      // Handle preview-rendered
      if (data.type === 'preview-rendered') {
        const renderedResult = PreviewRenderedMessageSchema.safeParse(data);
        if (renderedResult.success) {
          if (renderedResult.data.contentHeight && renderedResult.data.contentHeight > 200) {
            setContentHeight(renderedResult.data.contentHeight);
          }
          if (onRendererErrors) {
            onRendererErrors(renderedResult.data.errors || []);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [targetOrigin, sendDraftPayload, onRendererErrors]);

  // Connection timeout: switch to fallback after 4 seconds if no preview-ready
  useEffect(() => {
    if (previewBaseUrl && status === 'connecting') {
      connectionTimeoutRef.current = setTimeout(() => {
        setStatus('fallback');
      }, 4000);
    }
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, [previewBaseUrl, status, iframeKey]);

  const handleReload = () => {
    setStatus(previewBaseUrl ? 'connecting' : 'fallback');
    setIframeKey((prev) => prev + 1);
  };

  const previewUrl = previewBaseUrl
    ? `${previewBaseUrl}/preview/?page=${activePage}`
    : '';

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Page Switcher */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md overflow-x-auto max-w-full">
          {(['home', 'faqs', 'privacy', 'terms'] as PreviewPageType[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={`px-2 sm:px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap text-[11px] sm:text-xs ${
                activePage === p
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Viewport Width & Theme Controls */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Device switcher */}
          <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => setDeviceWidth(390)}
              title="Mobile (390px)"
              className={`p-1 rounded ${deviceWidth === 390 ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceWidth(768)}
              title="Tablet (768px)"
              className={`p-1 rounded ${deviceWidth === 768 ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'}`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceWidth(1280)}
              title="Desktop (1280px)"
              className={`p-1 rounded ${deviceWidth === 1280 ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} preview`}
            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Diff Mode Toggle */}
          <button
            type="button"
            onClick={() => setDiffMode(!diffMode)}
            title="Toggle changed items diff highlights"
            className={`p-1.5 rounded-md transition-colors ${
              diffMode
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </button>

          {/* Reload button */}
          <button
            type="button"
            onClick={handleReload}
            title="Reload preview"
            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Live Page link */}
          {previewBaseUrl && (
            <a
              href={`${previewBaseUrl}/${activePage === 'home' ? '' : activePage + '/'}`}
              target="_blank"
              rel="noreferrer"
              title="Open production URL in new tab"
              className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-1.5 font-medium shrink-0">
          {status === 'live' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Live preview
            </span>
          )}
          {status === 'connecting' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] animate-pulse">
              <RotateCw className="w-3 h-3 text-amber-600 animate-spin" />
              Connecting…
            </span>
          )}
          {status === 'fallback' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px]">
              <HelpCircle className="w-3 h-3 text-blue-600" />
              Approximate preview
            </span>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 flex justify-center bg-slate-200/50 dark:bg-slate-900/50">
        <div
          className="transition-all duration-200 shadow-md rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col"
          style={{ width: `${deviceWidth}px`, maxWidth: '100%', minHeight: '500px' }}
        >
          {status === 'fallback' || !previewUrl ? (
            <FallbackPreview
              page={activePage}
              site={site}
              faqs={faqs}
              legalMarkdown={legalMarkdown}
              focusId={focusId}
              theme={theme}
            />
          ) : (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={previewUrl}
              title={`Preview of ${site.siteName}`}
              className="w-full border-0 transition-opacity"
              style={{
                height: `${Math.max(600, contentHeight)}px`,
                backgroundColor: theme === 'dark' ? '#020617' : '#ffffff',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

