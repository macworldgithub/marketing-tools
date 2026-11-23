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
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type TabType = 'faqs' | 'privacy' | 'terms' | 'settings' | 'explainer';

function SiteEditorInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('faqs');
  const [activePage, setActivePage] = useState<PreviewPageType>('faqs');
  const [focusId, setFocusId] = useState<string>('');

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

  // Tab change also sets preview page
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'faqs') setActivePage('faqs');
    else if (tab === 'privacy') setActivePage('privacy');
    else if (tab === 'terms') setActivePage('terms');
    else setActivePage('home');
  };

  // Bump effective date helper
  const handleBumpDate = () => {
    if (!draftSite) return;
    const today = new Date().toISOString().slice(0, 10);
    setDraftSite({ ...draftSite, effectiveDate: today });
    setHasUnsaved(true);
  };

  // Copy FAQ to target sites
  const handleCopyFaqToSites = async (item: any, targets: string[]) => {
    for (const targetSlug of targets) {
      const pendingFaqs = await getPendingChange(`${targetSlug}/content/faqs.json`);
      let faqsData: FaqsData;
      if (pendingFaqs) {
        faqsData = JSON.parse(pendingFaqs.content);
      } else {
        const store = getActiveStore() || new MockStore();
        const content = await store.readSiteContent(targetSlug);
        faqsData = content.faqs;
      }

      // Skip if id already exists
      if (!faqsData.items.some((f) => f.id === item.id)) {
        faqsData.items.push(item);
        await setPendingChange(
          `${targetSlug}/content/faqs.json`,
          serializeFaqs(faqsData)
        );
      }
    }
    alert(`Copied FAQ "${item.question.slice(0, 30)}..." to ${targets.length} site(s).`);
  };

  // Save to drafts in IndexedDB
  const handleSaveDraft = async () => {
    if (!draftSite || !draftFaqs || !slug) return;

    await setPendingChange(`${slug}/content/site.json`, serializeSite(draftSite));
    await setPendingChange(`${slug}/content/faqs.json`, serializeFaqs(draftFaqs));
    await setPendingChange(`${slug}/content/privacy.md`, serializeMarkdown(draftPrivacy));
    await setPendingChange(`${slug}/content/terms.md`, serializeMarkdown(draftTerms));

    setHasUnsaved(true);
  };

  // Discard local changes and revert to clean head
  const handleDiscard = async () => {
    if (!confirm('Discard all local changes for this site? This cannot be undone.')) return;
    if (!cleanContent) return;

    await removePendingChange(`${slug}/content/site.json`);
    await removePendingChange(`${slug}/content/faqs.json`);
    await removePendingChange(`${slug}/content/privacy.md`);
    await removePendingChange(`${slug}/content/terms.md`);

    setDraftSite(cleanContent.site);
    setDraftFaqs(cleanContent.faqs);
    setDraftPrivacy(cleanContent.privacyMd);
    setDraftTerms(cleanContent.termsMd);
    setHasUnsaved(false);
  };

  // Auto-lint messages for active editor
  const lintMessages = useMemo(() => {
    if (!draftSite || !draftFaqs) return [];

    if (activeTab === 'faqs') {
      return lintFaqs(draftFaqs);
    } else if (activeTab === 'privacy') {
      return lintLegalMarkdown(draftPrivacy, draftSite, 'privacy');
    } else if (activeTab === 'terms') {
      return lintLegalMarkdown(draftTerms, draftSite, 'terms');
    }
    return [];
  }, [activeTab, draftSite, draftFaqs, draftPrivacy, draftTerms]);

  const hasErrors =
    lintMessages.some((m) => m.type === 'error') || productionErrors.length > 0;

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading site content...</div>;
  }

  if (error || !draftSite || !draftFaqs) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
        {error || 'Site not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {draftSite.siteName}
              {hasUnsaved && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                  Unsaved draft
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">{slug} · {draftSite.domain}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {hasUnsaved && (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <span>Save Draft</span>
          </button>

          <Link
            href="/review/"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Review & Commit</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => handleTabChange('faqs')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
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
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
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
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
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
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
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
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'explainer'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Explainer (Read-only)</span>
        </button>
      </div>

      {/* Main Split View: Left = Editor & Linter, Right = Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] items-start">
        {/* Left Column: Editor & Lint panel */}
        <div className="space-y-4">
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
              title="Privacy Policy Template (privacy.md)"
              onChange={(val) => {
                setDraftPrivacy(val);
                setHasUnsaved(true);
              }}
              onBumpDate={handleBumpDate}
              effectiveDate={draftSite.effectiveDate}
              isCustomized={draftPrivacy.trim() !== baselines?.privacyMasterMd.trim()}
              onShowBaselineDiff={() => setShowDiffModal(true)}
            />
          )}

          {activeTab === 'terms' && (
            <MarkdownEditor
              value={draftTerms}
              title="Terms of Service Template (terms.md)"
              onChange={(val) => {
                setDraftTerms(val);
                setHasUnsaved(true);
              }}
              onBumpDate={handleBumpDate}
              effectiveDate={draftSite.effectiveDate}
              isCustomized={draftTerms.trim() !== baselines?.termsMasterMd.trim()}
              onShowBaselineDiff={() => setShowDiffModal(true)}
            />
          )}

          {activeTab === 'settings' && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
                Site Metadata & Feature Flags
              </h2>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                <div className="flex gap-6">
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
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4">
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
        <div className="h-[750px]">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-3xl w-full p-4 space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold">
                Diff against baseline: {activeTab === 'privacy' ? 'privacy.master.md' : 'terms.master.md'}
              </h2>
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
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

