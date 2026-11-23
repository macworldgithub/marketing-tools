'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getActiveStore, MockStore } from '../../src/lib/store';
import {
  getPendingChange,
  setPendingChange,
  removePendingChange,
} from '../../src/lib/store/pending';
import { SiteContent, FaqsData, SiteConfig, MasterBaselines } from '../../src/lib/content/types';
import { serializeSite, serializeFaqs, serializeMarkdown } from '../../src/lib/content/serializer';
import { lintLegalMarkdown, lintFaqs } from '../../src/lib/content/linter';
import { FaqEditor } from '../../src/components/FaqEditor';
import { MarkdownEditor } from '../../src/components/MarkdownEditor';
import { LintPanel } from '../../src/components/LintPanel';
import { LivePreview } from '../../src/lib/preview/LivePreview';
import { DiffView } from '../../src/components/DiffView';
import { PreviewPageType } from '../../src/lib/preview/types';
import {
  Save,
  RotateCcw,
  GitCommit,
  ArrowLeft,
  Settings as SettingsIcon,
  HelpCircle,
  Shield,
  FileText,
  Info,
  Smartphone,
  Eye,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type TabType = 'faqs' | 'privacy' | 'terms' | 'settings' | 'explainer';
type MobileView = 'editor' | 'preview';

function SiteEditorInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('faqs');
  const [activePage, setActivePage] = useState<PreviewPageType>('faqs');
  const [focusId, setFocusId] = useState<string>('');
  const [mobileView, setMobileView] = useState<MobileView>('editor');

  // Clean site data loaded from store
  const [cleanContent, setCleanContent] = useState<SiteContent | null>(null);
  const [baselines, setBaselines] = useState<MasterBaselines | null>(null);
  const [availableSites, setAvailableSites] = useState<string[]>([]);

  // Draft state (local edits)
  const [draftSite, setDraftSite] = useState<SiteConfig | null>(null);
  const [draftFaqs, setDraftFaqs] = useState<FaqsData | null>(null);
  const [draftPrivacy, setDraftPrivacy] = useState<string>('');
  const [draftTerms, setDraftTerms] = useState<string>('');

  const [hasUnsaved, setHasUnsaved] = useState<boolean>(false);
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [productionErrors, setProductionErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) return;

    const loadSiteData = async () => {
      setLoading(true);
      let store = getActiveStore();
      if (!store) store = new MockStore();

      try {
        const bl = await store.readBaselines();
        setBaselines(bl);

        const sites = await store.listSites();
        setAvailableSites(sites);

        const loaded = await store.readSiteContent(slug, bl);
        setCleanContent(loaded);

        // Check for any persisted pending changes in IndexedDB
        const pendingSite = await getPendingChange(`${slug}/content/site.json`);
        const pendingFaqs = await getPendingChange(`${slug}/content/faqs.json`);
        const pendingPrivacy = await getPendingChange(`${slug}/content/privacy.md`);
        const pendingTerms = await getPendingChange(`${slug}/content/terms.md`);

        setDraftSite(pendingSite ? JSON.parse(pendingSite.content) : loaded.site);
        setDraftFaqs(pendingFaqs ? JSON.parse(pendingFaqs.content) : loaded.faqs);
        setDraftPrivacy(pendingPrivacy ? pendingPrivacy.content : loaded.privacyMd);
        setDraftTerms(pendingTerms ? pendingTerms.content : loaded.termsMd);

        if (pendingSite || pendingFaqs || pendingPrivacy || pendingTerms) {
          setHasUnsaved(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load site content.');
      } finally {
        setLoading(false);
      }
    };

    loadSiteData();
  }, [slug]);

  // Synchronize active preview page with active editor tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'faqs') setActivePage('faqs');
    else if (tab === 'privacy') setActivePage('privacy');
    else if (tab === 'terms') setActivePage('terms');
  };

  // Bump effective date to today (YYYY-MM-DD)
  const handleBumpDate = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (draftSite) {
      setDraftSite({ ...draftSite, effectiveDate: today });
      setHasUnsaved(true);
    }
  };

  // Copy an FAQ item to other sites
  const handleCopyFaqToSites = async (faqItem: any, targetSlugs: string[]) => {
    let store = getActiveStore();
    if (!store) store = new MockStore();

    for (const target of targetSlugs) {
      try {
        const targetClean = await store.readSiteContent(target);
        const existingPending = await getPendingChange(`${target}/content/faqs.json`);
        const targetFaqs: FaqsData = existingPending
          ? JSON.parse(existingPending.content)
          : targetClean.faqs;

        const updatedItems = targetFaqs.items.filter((i) => i.id !== faqItem.id);
        updatedItems.push(faqItem);
        const updatedFaqs = { ...targetFaqs, items: updatedItems };

        await setPendingChange(
          `${target}/content/faqs.json`,
          serializeFaqs(updatedFaqs)
        );
      } catch (err) {
        console.error(`Failed to copy FAQ to ${target}:`, err);
      }
    }
    alert(`FAQ copied to ${targetSlugs.length} target sites! Changes staged in pending review.`);
  };

  // Save current drafts into IndexedDB
  const handleSaveDraft = async () => {
    if (!draftSite || !draftFaqs || !cleanContent) return;

    // Save site.json draft if modified
    const curSite = serializeSite(draftSite);
    const origSite = serializeSite(cleanContent.site);
    if (curSite !== origSite) {
      await setPendingChange(`${slug}/content/site.json`, curSite);
    }

    // Save faqs.json draft if modified
    const curFaqs = serializeFaqs(draftFaqs);
    const origFaqs = serializeFaqs(cleanContent.faqs);
    if (curFaqs !== origFaqs) {
      await setPendingChange(`${slug}/content/faqs.json`, curFaqs);
    }

    // Save privacy.md draft if modified
    const curPrivacy = serializeMarkdown(draftPrivacy);
    const origPrivacy = serializeMarkdown(cleanContent.privacyMd);
    if (curPrivacy !== origPrivacy) {
      await setPendingChange(`${slug}/content/privacy.md`, curPrivacy);
    }

    // Save terms.md draft if modified
    const curTerms = serializeMarkdown(draftTerms);
    const origTerms = serializeMarkdown(cleanContent.termsMd);
    if (curTerms !== origTerms) {
      await setPendingChange(`${slug}/content/terms.md`, curTerms);
    }

    setHasUnsaved(false);
    alert('Draft changes successfully saved on device!');
  };

  // Discard local drafts and revert to clean store content
  const handleDiscard = async () => {
    if (!cleanContent) return;
    if (confirm('Discard all unsaved changes for this site?')) {
      await removePendingChange(`${slug}/content/site.json`);
      await removePendingChange(`${slug}/content/faqs.json`);
      await removePendingChange(`${slug}/content/privacy.md`);
      await removePendingChange(`${slug}/content/terms.md`);

      setDraftSite(cleanContent.site);
      setDraftFaqs(cleanContent.faqs);
      setDraftPrivacy(cleanContent.privacyMd);
      setDraftTerms(cleanContent.termsMd);
      setHasUnsaved(false);
    }
  };

  // Run linter on active document
  const lintMessages = useMemo(() => {
    if (!draftSite) return [];
    if (activeTab === 'faqs' && draftFaqs) {
      return lintFaqs(draftFaqs);
    }
    if (activeTab === 'privacy') {
      return lintLegalMarkdown(draftPrivacy, draftSite, 'privacy');
    }
    if (activeTab === 'terms') {
      return lintLegalMarkdown(draftTerms, draftSite, 'terms');
    }
    return [];
  }, [activeTab, draftFaqs, draftPrivacy, draftTerms, draftSite]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
        Loading site content for <span className="font-mono">{slug}</span>...
      </div>
    );
  }

  if (error || !draftSite || !draftFaqs) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs space-y-3">
        <h2 className="font-bold text-red-800 dark:text-red-300">Error Loading Site</h2>
        <p className="text-red-700 dark:text-red-400">{error || 'Site not found.'}</p>
        <Link href="/" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{draftSite.siteName}</span>
              {hasUnsaved && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded shadow-xs">
                  Unsaved draft
                </span>
              )}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono truncate max-w-[280px] sm:max-w-none">
              {slug} · {draftSite.domain}
            </p>
          </div>
        </div>

        {/* Action buttons */}
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
            href="/review/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs shrink-0"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Review & Commit</span>
          </Link>
        </div>
      </div>

      {/* Tabs (Horizontal scrolling on mobile) */}
      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 text-xs overflow-x-auto whitespace-nowrap pb-1">
        <button
          type="button"
          onClick={() => handleTabChange('faqs')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors shrink-0 ${
            activeTab === 'faqs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQs ({draftFaqs.items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('privacy')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors shrink-0 ${
            activeTab === 'privacy'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('terms')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors shrink-0 ${
            activeTab === 'terms'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Service</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors shrink-0 ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Site Settings (site.json)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('explainer')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors shrink-0 ${
            activeTab === 'explainer'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Explainer (Read-only)</span>
        </button>
      </div>

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
          <span>Content Editor</span>
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
          <span>Live Preview</span>
        </button>
      </div>

      {/* Main Split View: Left = Editor & Linter, Right = Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] items-start">
        {/* Left Column: Editor & Lint panel */}
        <div className={`space-y-4 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {activeTab === 'faqs' && (
            <FaqEditor
              faqs={draftFaqs}
              availableSites={availableSites}
              currentSlug={slug}
              onFaqsChange={(updated) => {
                setDraftFaqs(updated);
                setHasUnsaved(true);
              }}
              onFocusItem={(id) => {
                setFocusId(id);
                setActivePage('faqs');
              }}
              onCopyToSites={handleCopyFaqToSites}
            />
          )}

          {activeTab === 'privacy' && (
            <MarkdownEditor
              value={draftPrivacy}
              title="Privacy Policy (privacy.md)"
              onChange={(val) => {
                setDraftPrivacy(val);
                setHasUnsaved(true);
              }}
              onBumpDate={handleBumpDate}
              effectiveDate={draftSite.effectiveDate}
              isCustomized={cleanContent?.isCustomPrivacy}
              onShowBaselineDiff={() => setShowDiffModal(true)}
            />
          )}

          {activeTab === 'terms' && (
            <MarkdownEditor
              value={draftTerms}
              title="Terms of Service (terms.md)"
              onChange={(val) => {
                setDraftTerms(val);
                setHasUnsaved(true);
              }}
              onBumpDate={handleBumpDate}
              effectiveDate={draftSite.effectiveDate}
              isCustomized={cleanContent?.isCustomTerms}
              onShowBaselineDiff={() => setShowDiffModal(true)}
            />
          )}

          {activeTab === 'settings' && (
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Site Settings (content/site.json)</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Site Name</label>
                  <input
                    type="text"
                    value={draftSite.siteName}
                    onChange={(e) => {
                      setDraftSite({ ...draftSite, siteName: e.target.value });
                      setHasUnsaved(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tool Name</label>
                  <input
                    type="text"
                    value={draftSite.toolName}
                    onChange={(e) => {
                      setDraftSite({ ...draftSite, toolName: e.target.value });
                      setHasUnsaved(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Domain</label>
                  <input
                    type="text"
                    value={draftSite.domain}
                    onChange={(e) => {
                      setDraftSite({ ...draftSite, domain: e.target.value });
                      setHasUnsaved(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Email</label>
                  <input
                    type="email"
                    value={draftSite.contactEmail}
                    onChange={(e) => {
                      setDraftSite({ ...draftSite, contactEmail: e.target.value });
                      setHasUnsaved(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Effective Date</label>
                  <input
                    type="text"
                    value={draftSite.effectiveDate}
                    onChange={(e) => {
                      setDraftSite({ ...draftSite, effectiveDate: e.target.value });
                      setHasUnsaved(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Accent Color</label>
                  <select
                    value={draftSite.accent}
                    onChange={(e) => {
                      setDraftSite({ ...draftSite, accent: e.target.value as any });
                      setHasUnsaved(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded"
                  >
                    {['blue', 'teal', 'indigo', 'emerald', 'slate'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Features & Policy Flags</label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSite.features.ads}
                      onChange={(e) => {
                        setDraftSite({
                          ...draftSite,
                          features: { ...draftSite.features, ads: e.target.checked },
                        });
                        setHasUnsaved(true);
                      }}
                    />
                    <span>features.ads (enables ad clause)</span>
                  </label>

                  <label className="flex items-center gap-1.5">
                    <span>features.analytics:</span>
                    <select
                      value={draftSite.features.analytics}
                      onChange={(e) => {
                        setDraftSite({
                          ...draftSite,
                          features: { ...draftSite.features, analytics: e.target.value as any },
                        });
                        setHasUnsaved(true);
                      }}
                      className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border rounded"
                    >
                      <option value="none">none</option>
                      <option value="plausible">plausible</option>
                      <option value="ga4">ga4</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explainer' && (
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Explainer Content (explainer.md)</h2>
                <span className="text-xs text-slate-400">Read-only in v1</span>
              </div>
              <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-300">
                <ReactMarkdown>{cleanContent?.explainerMd || 'No explainer text.'}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Lint Panel */}
          <LintPanel messages={lintMessages} productionErrors={productionErrors} />
        </div>

        {/* Right Column: Live Preview on real site */}
        <div className={`h-[650px] sm:h-[750px] lg:h-[800px] ${mobileView === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <LivePreview
            site={draftSite}
            faqs={draftFaqs}
            legalMarkdown={activeTab === 'terms' ? draftTerms : draftPrivacy}
            activePage={activePage}
            focusId={focusId}
            onPageChange={setActivePage}
            onRendererErrors={setProductionErrors}
          />
        </div>
      </div>

      {/* Baseline Diff Modal */}
      {showDiffModal && baselines && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-3xl w-full p-4 space-y-3 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs sm:text-sm font-bold truncate">
                Diff against baseline: {activeTab === 'privacy' ? 'privacy.master.md' : 'terms.master.md'}
              </h2>
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 shrink-0"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DiffView
                oldTitle="Master Baseline"
                newTitle="Current Site Customization"
                oldText={activeTab === 'privacy' ? baselines.privacyMasterMd : baselines.termsMasterMd}
                newText={activeTab === 'privacy' ? draftPrivacy : draftTerms}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteEditorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading editor...</div>}>
      <SiteEditorInner />
    </Suspense>
  );
}
