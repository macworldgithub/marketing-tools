'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
import {
  Save,
  RotateCcw,
  Layers,
  Shield,
  FileText,
  Columns,
  Eye,
  Edit3,
} from 'lucide-react';

export default function BaselineEditorPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [baselines, setBaselines] = useState<MasterBaselines | null>(null);
  const [availableSites, setAvailableSites] = useState<string[]>([]);

  const [activeDoc, setActiveDoc] = useState<'privacy' | 'terms'>('privacy');
  const [previewSlug, setPreviewSlug] = useState<string>('');
  const [previewSiteConfig, setPreviewSiteConfig] = useState<SiteConfig | null>(null);
  const [previewFaqs, setPreviewFaqs] = useState<FaqsData | null>(null);

  // Draft state for baselines
  const [draftPrivacyMaster, setDraftPrivacyMaster] = useState<string>('');
  const [draftTermsMaster, setDraftTermsMaster] = useState<string>('');
  const [hasUnsaved, setHasUnsaved] = useState<boolean>(false);

  // 3-site compare view state
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareSitesData, setCompareSitesData] = useState<Record<string, { site: SiteConfig; faqs: FaqsData }>>({});
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const loadData = async () => {
    setLoading(true);
    let store = getActiveStore();
    if (!store) store = new MockStore();

    try {
      const bl = await store.readBaselines();
      setBaselines(bl);

      const sites = await store.listSites();
      setAvailableSites(sites);

      if (sites.length > 0) {
        setPreviewSlug(sites[0]);
      }

      // Check IndexedDB for pending baseline drafts
      const pPrivacy = await getPendingChange('_shared/privacy.master.md');
      const pTerms = await getPendingChange('_shared/terms.master.md');

      setDraftPrivacyMaster(pPrivacy ? pPrivacy.content : bl.privacyMasterMd);
      setDraftTermsMaster(pTerms ? pTerms.content : bl.termsMasterMd);

      if (pPrivacy || pTerms) {
        setHasUnsaved(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load master baselines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When previewSlug changes, fetch that site's config and faqs for preview interpolation
  useEffect(() => {
    if (!previewSlug) return;
    let store = getActiveStore();
    if (!store) store = new MockStore();

    store.readSiteContent(previewSlug).then((c) => {
      setPreviewSiteConfig(c.site);
      setPreviewFaqs(c.faqs);
    }).catch(() => {});
  }, [previewSlug]);

  // When compareMode is activated, load 3 diverse sample sites (e.g. bmi-calculator, loan-calculator, qr-code-generator)
  const compareSlugs = useMemo(() => {
    const defaultThree = ['bmi-calculator', 'loan-calculator', 'qr-code-generator'];
    const matching = defaultThree.filter((s) => availableSites.includes(s));
    return matching.length === 3 ? matching : availableSites.slice(0, 3);
  }, [availableSites]);

  useEffect(() => {
    if (!compareMode || compareSlugs.length === 0) return;
    let store = getActiveStore();
    if (!store) store = new MockStore();

    Promise.all(compareSlugs.map((s) => store!.readSiteContent(s))).then((results) => {
      const data: Record<string, { site: SiteConfig; faqs: FaqsData }> = {};
      results.forEach((r) => {
        data[r.slug] = { site: r.site, faqs: r.faqs };
      });
      setCompareSitesData(data);
    });
  }, [compareMode, compareSlugs]);

  const handleSaveDraft = async () => {
    if (!baselines) return;

    if (draftPrivacyMaster !== baselines.privacyMasterMd) {
      await setPendingChange(
        '_shared/privacy.master.md',
        serializeMarkdown(draftPrivacyMaster)
      );
    }

    if (draftTermsMaster !== baselines.termsMasterMd) {
      await setPendingChange(
        '_shared/terms.master.md',
        serializeMarkdown(draftTermsMaster)
      );
    }

    setHasUnsaved(false);
    alert('Master baseline draft saved!');
  };

  const handleDiscard = async () => {
    if (!baselines) return;
    if (confirm('Discard baseline edits?')) {
      await removePendingChange('_shared/privacy.master.md');
      await removePendingChange('_shared/terms.master.md');
      setDraftPrivacyMaster(baselines.privacyMasterMd);
      setDraftTermsMaster(baselines.termsMasterMd);
      setHasUnsaved(false);
    }
  };

  const activeMarkdown = activeDoc === 'privacy' ? draftPrivacyMaster : draftTermsMaster;

  // Lint active baseline against the preview site context
  const lintMessages = useMemo(() => {
    if (!previewSiteConfig) return [];
    return lintLegalMarkdown(activeMarkdown, previewSiteConfig, activeDoc);
  }, [activeMarkdown, previewSiteConfig, activeDoc]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading master baselines...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Master Baseline Legal Templates</span>
            {hasUnsaved && (
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded shadow-xs">
                Unsaved draft
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Edit <code>_shared/privacy.master.md</code> and <code>_shared/terms.master.md</code> with zero-drift strict templating.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {hasUnsaved && (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold shadow-xs shrink-0"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span>Save Draft</span>
          </button>

          <Link
            href="/bulk/?action=apply-baseline"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Apply to Sites</span>
          </Link>
        </div>
      </div>

      {/* Document Selector & Preview Site Picker */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
        {/* Doc Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md self-start sm:self-auto">
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
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Preview as:</span>
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
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 font-semibold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare 3 Sites</span>
          </button>
        </div>
      </div>

      {/* Compare View: 3 sites side-by-side or stacked on mobile */}
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
                <div key={slug} className="h-[550px] sm:h-[650px] flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
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
        <>
          {/* Mobile / Tablet Segmented Toggle (< lg) */}
          <div className="lg:hidden flex items-center justify-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMobileView('editor')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                mobileView === 'editor'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Master Template</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                mobileView === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Site Preview</span>
            </button>
          </div>

          {/* Standard Split View: Editor on Left, Live Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] items-start">
            <div className={`space-y-4 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
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

            <div className={`h-[650px] sm:h-[750px] ${mobileView === 'editor' ? 'hidden lg:block' : 'block'}`}>
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
        </>
      )}
    </div>
  );
}
