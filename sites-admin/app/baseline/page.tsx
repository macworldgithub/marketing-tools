'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getActiveStore, MockStore } from '../../src/lib/store';
import {
  getPendingChange,
  setPendingChange,
  removePendingChange,
} from '../../src/lib/store/pending';
import { MasterBaselines, SiteConfig, FaqsData } from '../../src/lib/content/types';
import { serializeMarkdown } from '../../src/lib/content/serializer';
import { lintLegalMarkdown } from '../../src/lib/content/linter';
import { MarkdownEditor } from '../../src/components/MarkdownEditor';
import { LintPanel } from '../../src/components/LintPanel';
import { LivePreview } from '../../src/lib/preview/LivePreview';
import { PreviewPageType } from '../../src/lib/preview/types';
import {
  Save,
  RotateCcw,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Columns,
} from 'lucide-react';
import Link from 'next/link';

type BaselineDocType = 'privacy' | 'terms';

export default function BaselineEditorPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<BaselineDocType>('privacy');

  // Baseline master drafts
  const [cleanBaselines, setCleanBaselines] = useState<MasterBaselines | null>(null);
  const [draftPrivacyMaster, setDraftPrivacyMaster] = useState<string>('');
  const [draftTermsMaster, setDraftTermsMaster] = useState<string>('');
  const [hasUnsaved, setHasUnsaved] = useState<boolean>(false);

  // Available sites for previewing baseline
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [previewSlug, setPreviewSlug] = useState<string>('bmi-calculator');
  const [previewSiteConfig, setPreviewSiteConfig] = useState<SiteConfig | null>(null);
  const [previewFaqs, setPreviewFaqs] = useState<FaqsData | null>(null);

  // Multi-site compare view (up to 3 sites)
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareSlugs, setCompareSlugs] = useState<string[]>(['bmi-calculator', 'loan-calculator']);
  const [compareSitesData, setCompareSitesData] = useState<Record<string, { site: SiteConfig; faqs: FaqsData }>>({});

  useEffect(() => {
    const loadBaselinesAndSites = async () => {
      setLoading(true);
      let store = getActiveStore();
      if (!store) store = new MockStore();

      try {
        const bl = await store.readBaselines();
        setCleanBaselines(bl);

        // Check pending drafts
        const pendingPriv = await getPendingChange('_shared/privacy.master.md');
        const pendingTerms = await getPendingChange('_shared/terms.master.md');

        setDraftPrivacyMaster(pendingPriv ? pendingPriv.content : bl.privacyMasterMd);
        setDraftTermsMaster(pendingTerms ? pendingTerms.content : bl.termsMasterMd);

        if (pendingPriv || pendingTerms) {
          setHasUnsaved(true);
        }

        const slugs = await store.listSites();
        setAvailableSites(slugs);

        if (slugs.length > 0) {
          const firstSlug = slugs[0];
          setPreviewSlug(firstSlug);
          const firstContent = await store.readSiteContent(firstSlug, bl);
          setPreviewSiteConfig(firstContent.site);
          setPreviewFaqs(firstContent.faqs);

          // Preload compare sites
          const compData: Record<string, { site: SiteConfig; faqs: FaqsData }> = {};
          for (const s of slugs.slice(0, 3)) {
            const c = await store.readSiteContent(s, bl);
            compData[s] = { site: c.site, faqs: c.faqs };
          }
          setCompareSitesData(compData);
          setCompareSlugs(slugs.slice(0, Math.min(3, slugs.length)));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load baseline templates.');
      } finally {
        setLoading(false);
      }
    };

    loadBaselinesAndSites();
  }, []);

  // Update preview site config when previewSlug changes
  useEffect(() => {
    if (!previewSlug) return;
    const fetchSite = async () => {
      let store = getActiveStore();
      if (!store) store = new MockStore();
      try {
        const c = await store.readSiteContent(previewSlug);
        setPreviewSiteConfig(c.site);
        setPreviewFaqs(c.faqs);
      } catch {}
    };
    fetchSite();
  }, [previewSlug]);

  const handleSaveDraft = async () => {
    await setPendingChange('_shared/privacy.master.md', serializeMarkdown(draftPrivacyMaster));
    await setPendingChange('_shared/terms.master.md', serializeMarkdown(draftTermsMaster));
    setHasUnsaved(true);
  };

  const handleDiscard = async () => {
    if (!confirm('Discard all unsaved edits to baseline master templates?')) return;
    if (!cleanBaselines) return;

    await removePendingChange('_shared/privacy.master.md');
    await removePendingChange('_shared/terms.master.md');

    setDraftPrivacyMaster(cleanBaselines.privacyMasterMd);
    setDraftTermsMaster(cleanBaselines.termsMasterMd);
    setHasUnsaved(false);
  };

  // Lint active baseline against current preview site config
  const lintMessages = useMemo(() => {
    if (!previewSiteConfig) return [];
    const text = activeDoc === 'privacy' ? draftPrivacyMaster : draftTermsMaster;
    return lintLegalMarkdown(text, previewSiteConfig, activeDoc);
  }, [activeDoc, draftPrivacyMaster, draftTermsMaster, previewSiteConfig]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading master baselines...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-800 rounded text-xs">{error}</div>;
  }

  const activeMarkdown = activeDoc === 'privacy' ? draftPrivacyMaster : draftTermsMaster;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Baseline Legal Templates
            {hasUnsaved && (
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                Unsaved baseline draft
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Source templates in <code>_shared/*.master.md</code>. Saving the baseline changes no website until applied.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasUnsaved && (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span>Save Baseline Draft</span>
          </button>

          <Link
            href="/bulk/?action=apply-baseline"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Apply Baseline to Sites</span>
          </Link>
        </div>
      </div>

      {/* Document Selector & Preview Site Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
        {/* Doc Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium transition-colors ${
              activeDoc === 'privacy'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>privacy.master.md</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium transition-colors ${
              activeDoc === 'terms'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>terms.master.md</span>
          </button>
        </div>

        {/* Preview controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Preview as site:</span>
            <select
              value={previewSlug}
              onChange={(e) => setPreviewSlug(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
            >
              {availableSites.map((slug) => (
                <option key={slug} value={slug}>{slug}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
              compareMode
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare 3 Sites</span>
          </button>
        </div>
      </div>

      {/* Compare View: 3 sites side-by-side */}
      {compareMode ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500">
            Comparing how baseline {activeDoc}.master.md interpolates across 3 different sites:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {compareSlugs.map((slug) => {
              const data = compareSitesData[slug];
              if (!data) return null;
              return (
                <div key={slug} className="h-[650px] flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold border-b border-slate-200 dark:border-slate-700 flex justify-between">
                    <span>{data.site.siteName}</span>
                    <span className="font-mono text-slate-400">{slug}</span>
                  </div>
                  <div className="flex-1">
                    <LivePreview
                      site={data.site}
                      faqs={data.faqs}
                      legalMarkdown={activeMarkdown}
                      activePage={activeDoc}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard Split View: Editor on Left, Live Preview on Right */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] items-start">
          <div className="space-y-4">
            <MarkdownEditor
              value={activeMarkdown}
              title={`Master Baseline (${activeDoc}.master.md)`}
              onChange={(val) => {
                if (activeDoc === 'privacy') setDraftPrivacyMaster(val);
                else setDraftTermsMaster(val);
                setHasUnsaved(true);
              }}
            />
            <LintPanel messages={lintMessages} />
          </div>

          <div className="h-[750px]">
            {previewSiteConfig && previewFaqs && (
              <LivePreview
                site={previewSiteConfig}
                faqs={previewFaqs}
                legalMarkdown={activeMarkdown}
                activePage={activeDoc}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

