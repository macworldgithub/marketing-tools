'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getActiveStore, MockStore } from '../../src/lib/store';
import {
  setPendingChange,
  getPendingChange,
} from '../../src/lib/store/pending';
import { SiteContent, FaqItem, FaqsData, MasterBaselines } from '../../src/lib/content/types';
import { serializeSite, serializeFaqs, serializeMarkdown } from '../../src/lib/content/serializer';
import { SitePicker } from '../../src/components/SitePicker';
import {
  Search,
  Replace,
  Layers,
  Plus,
  FileCheck,
  ArrowRight,
  Sliders,
  Check,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

type BulkActionType = 'find-replace' | 'set-field' | 'insert-faq' | 'apply-baseline';

function BulkOperationsInner() {
  const searchParams = useSearchParams();
  const initialAction = (searchParams.get('action') as BulkActionType) || 'find-replace';
  const initialSitesParam = searchParams.get('sites') || '';
  const router = useRouter();

  const [action, setAction] = useState<BulkActionType>(initialAction);
  const [allSlugs, setAllSlugs] = useState<string[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [isSitePickerOpen, setIsSitePickerOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Find & Replace state
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [targetScopes, setTargetScopes] = useState<{ privacy: boolean; terms: boolean; faqs: boolean }>({
    privacy: true,
    terms: true,
    faqs: true,
  });

  // Set Field state
  const [fieldName, setFieldName] = useState<'contactEmail' | 'effectiveDate' | 'ads' | 'analytics'>('effectiveDate');
  const [fieldValue, setFieldValue] = useState<string>(new Date().toISOString().slice(0, 10));

  // Insert FAQ state
  const [newFaqId, setNewFaqId] = useState<string>('');
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>('');
  const [faqPosition, setFaqPosition] = useState<'append' | 'prepend'>('append');

  // Apply Baseline state
  const [applyScope, setApplyScope] = useState<{ privacy: boolean; terms: boolean }>({
    privacy: true,
    terms: true,
  });
  const [confirmCustomizedLoss, setConfirmCustomizedLoss] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      let store = getActiveStore();
      if (!store) store = new MockStore();

      try {
        const slugs = await store.listSites();
        setAllSlugs(slugs);

        if (initialSitesParam) {
          const split = initialSitesParam.split(',').filter((s) => slugs.includes(s));
          setSelectedSites(split.length > 0 ? split : slugs);
        } else {
          setSelectedSites(slugs);
        }
      } catch {}
      setLoading(false);
    };
    init();
  }, [initialSitesParam]);

  const handleApplyBulk = async () => {
    if (selectedSites.length === 0) {
      alert('Please select at least one target site.');
      return;
    }

    let store = getActiveStore();
    if (!store) store = new MockStore();
    const baselines = await store.readBaselines();

    let affectedFilesCount = 0;

    for (const slug of selectedSites) {
      const siteContent = await store.readSiteContent(slug, baselines);

      // Check existing pending drafts
      const pendingSite = await getPendingChange(`${slug}/content/site.json`);
      const pendingFaqs = await getPendingChange(`${slug}/content/faqs.json`);
      const pendingPriv = await getPendingChange(`${slug}/content/privacy.md`);
      const pendingTerms = await getPendingChange(`${slug}/content/terms.md`);

      const currentSite = pendingSite ? JSON.parse(pendingSite.content) : siteContent.site;
      const currentFaqs = pendingFaqs ? JSON.parse(pendingFaqs.content) : siteContent.faqs;
      let currentPriv = pendingPriv ? pendingPriv.content : siteContent.privacyMd;
      let currentTerms = pendingTerms ? pendingTerms.content : siteContent.termsMd;

      // 1. Find & Replace
      if (action === 'find-replace' && findText) {
        let pattern: RegExp;
        try {
          pattern = useRegex
            ? new RegExp(findText, matchCase ? 'g' : 'gi')
            : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
        } catch (e: any) {
          alert('Invalid regular expression: ' + e.message);
          return;
        }

        if (targetScopes.privacy && pattern.test(currentPriv)) {
          currentPriv = currentPriv.replace(pattern, replaceText);
          await setPendingChange(`${slug}/content/privacy.md`, serializeMarkdown(currentPriv));
          affectedFilesCount++;
        }
        if (targetScopes.terms && pattern.test(currentTerms)) {
          currentTerms = currentTerms.replace(pattern, replaceText);
          await setPendingChange(`${slug}/content/terms.md`, serializeMarkdown(currentTerms));
          affectedFilesCount++;
        }
        if (targetScopes.faqs) {
          let faqsChanged = false;
          const updatedItems = currentFaqs.items.map((item: FaqItem) => {
            const qChanged = pattern.test(item.question);
            const aChanged = pattern.test(item.answer);
            if (qChanged || aChanged) {
              faqsChanged = true;
              return {
                ...item,
                question: item.question.replace(pattern, replaceText),
                answer: item.answer.replace(pattern, replaceText),
              };
            }
            return item;
          });
          if (faqsChanged) {
            await setPendingChange(
              `${slug}/content/faqs.json`,
              serializeFaqs({ ...currentFaqs, items: updatedItems })
            );
            affectedFilesCount++;
          }
        }
      }

      // 2. Set Field
      if (action === 'set-field') {
        const updatedSite = { ...currentSite };
        if (fieldName === 'contactEmail') updatedSite.contactEmail = fieldValue;
        else if (fieldName === 'effectiveDate') updatedSite.effectiveDate = fieldValue;
        else if (fieldName === 'ads') updatedSite.features = { ...updatedSite.features, ads: fieldValue === 'true' };
        else if (fieldName === 'analytics') updatedSite.features = { ...updatedSite.features, analytics: fieldValue as any };

        await setPendingChange(`${slug}/content/site.json`, serializeSite(updatedSite));
        affectedFilesCount++;
      }

      // 3. Insert FAQ
      if (action === 'insert-faq' && newFaqQuestion && newFaqAnswer) {
        const id = newFaqId || newFaqQuestion.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
        // Do not add duplicate
        if (!currentFaqs.items.some((i: FaqItem) => i.id === id)) {
          const newItem: FaqItem = { id, question: newFaqQuestion, answer: newFaqAnswer };
          const updatedItems = faqPosition === 'append' ? [...currentFaqs.items, newItem] : [newItem, ...currentFaqs.items];
          await setPendingChange(
            `${slug}/content/faqs.json`,
            serializeFaqs({ ...currentFaqs, items: updatedItems })
          );
          affectedFilesCount++;
        }
      }

      // 4. Apply Baseline
      if (action === 'apply-baseline') {
        if (applyScope.privacy) {
          await setPendingChange(`${slug}/content/privacy.md`, serializeMarkdown(baselines.privacyMasterMd));
          affectedFilesCount++;
        }
        if (applyScope.terms) {
          await setPendingChange(`${slug}/content/terms.md`, serializeMarkdown(baselines.termsMasterMd));
          affectedFilesCount++;
        }
      }
    }

    router.push('/review/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Bulk Operations</h1>
        <p className="text-xs text-slate-500">
          Apply automated content updates across multiple tool repositories simultaneously. All operations generate draft changes for review before committing.
        </p>
      </div>

      {/* Action Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
        {[
          { id: 'find-replace', label: 'Find & Replace', icon: Replace },
          { id: 'set-field', label: 'Set Field', icon: Sliders },
          { id: 'insert-faq', label: 'Insert FAQ', icon: Plus },
          { id: 'apply-baseline', label: 'Apply Baseline', icon: FileCheck },
        ].map((btn) => {
          const Icon = btn.icon;
          const active = action === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setAction(btn.id as BulkActionType)}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                active
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Target Sites selector banner */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-slate-900 dark:text-white">Target Scope: </span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedSites.length}</span>
          <span className="text-slate-500"> of {allSlugs.length} sites selected</span>
        </div>
        <button
          type="button"
          onClick={() => setIsSitePickerOpen(true)}
          className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
        >
          Select Sites
        </button>
      </div>

      {/* Action Configuration Body */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-4 text-xs">
        {/* 1. Find & Replace */}
        {action === 'find-replace' && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
              Find & Replace Across Sites
            </h2>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Find Text / Pattern</label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="String to find..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Replace With</label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement text..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
              />
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                />
                <span>Match Case</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                />
                <span>Regular Expression (Advanced)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Files</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetScopes.privacy}
                    onChange={(e) => setTargetScopes({ ...targetScopes, privacy: e.target.checked })}
                  />
                  <span>privacy.md</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetScopes.terms}
                    onChange={(e) => setTargetScopes({ ...targetScopes, terms: e.target.checked })}
                  />
                  <span>terms.md</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetScopes.faqs}
                    onChange={(e) => setTargetScopes({ ...targetScopes, faqs: e.target.checked })}
                  />
                  <span>faqs.json</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 2. Set Field */}
        {action === 'set-field' && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
              Set Field in site.json Across Sites
            </h2>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Select Field</label>
              <select
                value={fieldName}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setFieldName(val);
                  if (val === 'effectiveDate') setFieldValue(new Date().toISOString().slice(0, 10));
                  else if (val === 'ads') setFieldValue('false');
                  else if (val === 'analytics') setFieldValue('none');
                }}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
              >
                <option value="effectiveDate">effectiveDate (YYYY-MM-DD)</option>
                <option value="contactEmail">contactEmail</option>
                <option value="ads">features.ads (boolean)</option>
                <option value="analytics">features.analytics (none | plausible | ga4)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">New Value</label>
              {fieldName === 'ads' ? (
                <select
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              ) : fieldName === 'analytics' ? (
                <select
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
                >
                  <option value="none">none</option>
                  <option value="plausible">plausible</option>
                  <option value="ga4">ga4</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Enter new value..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
                />
              )}
            </div>
          </div>
        )}

        {/* 3. Insert FAQ */}
        {action === 'insert-faq' && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
              Append / Insert FAQ into Sites
            </h2>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Question</label>
              <input
                type="text"
                value={newFaqQuestion}
                onChange={(e) => {
                  setNewFaqQuestion(e.target.value);
                  if (!newFaqId) {
                    setNewFaqId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40));
                  }
                }}
                placeholder="Question text..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">FAQ Anchor ID</label>
              <input
                type="text"
                value={newFaqId}
                onChange={(e) => setNewFaqId(e.target.value)}
                placeholder="kebab-case-id"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Answer (Markdown)</label>
              <textarea
                rows={4}
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Answer text..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Position</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="faqPosition"
                    value="append"
                    checked={faqPosition === 'append'}
                    onChange={() => setFaqPosition('append')}
                  />
                  <span>Append to end of list</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="faqPosition"
                    value="prepend"
                    checked={faqPosition === 'prepend'}
                    onChange={() => setFaqPosition('prepend')}
                  />
                  <span>Prepend to beginning</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 4. Apply Baseline */}
        {action === 'apply-baseline' && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
              Apply Master Baseline Templates to Sites
            </h2>
            <p className="text-slate-500">
              Replaces each selected site&apos;s <code>privacy.md</code> and/or <code>terms.md</code> with the master text from <code>_shared/</code>.
            </p>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Templates to Apply:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyScope.privacy}
                    onChange={(e) => setApplyScope({ ...applyScope, privacy: e.target.checked })}
                  />
                  <span>Apply privacy.master.md to privacy.md</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyScope.terms}
                    onChange={(e) => setApplyScope({ ...applyScope, terms: e.target.checked })}
                  />
                  <span>Apply terms.master.md to terms.md</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Warning for Customised Sites:</strong> Any custom clauses or hand-written wording in the target site&apos;s policy will be replaced by the baseline.
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleApplyBulk}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <span>Stage Changes & Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Site Picker Modal */}
      <SitePicker
        isOpen={isSitePickerOpen}
        title="Select Target Sites for Bulk Operation"
        availableSites={allSlugs}
        selectedSites={selectedSites}
        onChange={setSelectedSites}
        onClose={() => setIsSitePickerOpen(false)}
      />
    </div>
  );
}

export default function BulkOperationsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading bulk operations...</div>}>
      <BulkOperationsInner />
    </Suspense>
  );
}

