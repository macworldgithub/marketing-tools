'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getActiveStore, MockStore } from '../../src/lib/store';
import {
  getAllPendingChanges,
  clearAllPendingChanges,
  removePendingChange,
} from '../../src/lib/store/pending';
import { FileChange, CommitResult, DeployStatus } from '../../src/lib/store/types';
import { SiteSchema, FaqsSchema } from '../../src/lib/content/schemas';
import { lintLegalMarkdown, lintFaqs } from '../../src/lib/content/linter';
import { DiffView } from '../../src/components/DiffView';
import {
  GitCommit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface SiteValidationReport {
  slug: string;
  files: Array<{
    path: string;
    oldContent: string;
    newContent: string;
  }>;
  errors: string[];
  warnings: string[];
}

export default function ReviewScreenPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([]);
  const [reports, setReports] = useState<SiteValidationReport[]>([]);
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Commit state
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);

  const loadChangesAndValidate = async () => {
    setLoading(true);
    let store = getActiveStore();
    if (!store) store = new MockStore();

    try {
      const changes = await getAllPendingChanges();
      setPendingChanges(changes);

      if (changes.length === 0) {
        setLoading(false);
        return;
      }

      // Group changes by site slug (or "_shared")
      const groups: Record<string, FileChange[]> = {};
      const origs: Record<string, string> = {};

      for (const c of changes) {
        const parts = c.path.split('/');
        const groupKey = parts[0];
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(c);

        // Fetch original content from store
        try {
          origs[c.path] = await store.readFile(c.path);
        } catch {
          origs[c.path] = '';
        }
      }
      setOriginalContents(origs);

      // Validate each affected site
      const validationReports: SiteValidationReport[] = [];
      const baselines = await store.readBaselines();

      for (const [slug, fileChanges] of Object.entries(groups)) {
        const rep: SiteValidationReport = {
          slug,
          files: fileChanges.map((fc) => ({
            path: fc.path,
            oldContent: origs[fc.path] || '',
            newContent: fc.content,
          })),
          errors: [],
          warnings: [],
        };

        if (slug !== '_shared') {
          try {
            // Load clean site content and overlay draft changes
            const cleanContent = await store.readSiteContent(slug, baselines);
            let siteConfig = cleanContent.site;
            let faqsData = cleanContent.faqs;
            let privacyMd = cleanContent.privacyMd;
            let termsMd = cleanContent.termsMd;

            for (const fc of fileChanges) {
              if (fc.path.endsWith('site.json')) {
                const parsed = JSON.parse(fc.content);
                const valRes = SiteSchema.safeParse(parsed);
                if (!valRes.success) {
                  rep.errors.push(`site.json: ${valRes.error.issues.map((i) => i.message).join(', ')}`);
                } else {
                  siteConfig = valRes.data;
                }
              } else if (fc.path.endsWith('faqs.json')) {
                const parsed = JSON.parse(fc.content);
                const valRes = FaqsSchema.safeParse(parsed);
                if (!valRes.success) {
                  rep.errors.push(`faqs.json: ${valRes.error.issues.map((i) => i.message).join(', ')}`);
                } else {
                  faqsData = valRes.data;
                }
                const faqLint = lintFaqs(parsed);
                for (const m of faqLint) {
                  if (m.type === 'error') rep.errors.push(m.message);
                  else rep.warnings.push(m.message);
                }
              } else if (fc.path.endsWith('privacy.md')) {
                privacyMd = fc.content;
                const pLint = lintLegalMarkdown(fc.content, siteConfig, 'privacy');
                for (const m of pLint) {
                  if (m.type === 'error') rep.errors.push(m.message);
                  else rep.warnings.push(m.message);
                }
              } else if (fc.path.endsWith('terms.md')) {
                termsMd = fc.content;
                const tLint = lintLegalMarkdown(fc.content, siteConfig, 'terms');
                for (const m of tLint) {
                  if (m.type === 'error') rep.errors.push(m.message);
                  else rep.warnings.push(m.message);
                }
              }
            }
          } catch (err: any) {
            rep.errors.push(`Validation failure: ${err.message}`);
          }
        }

        validationReports.push(rep);
      }

      setReports(validationReports);

      // Auto-generate commit message
      const siteCount = Object.keys(groups).filter((g) => g !== '_shared').length;
      let msg = '';
      if (groups['_shared'] && siteCount === 0) {
        msg = 'content: update master baseline templates';
      } else if (siteCount === 1) {
        msg = `content: update content for ${Object.keys(groups)[0]}`;
      } else {
        msg = `content: update content across ${siteCount} tool sites`;
      }
      setCommitMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChangesAndValidate();
  }, []);

  const totalErrors = useMemo(
    () => reports.reduce((acc, r) => acc + r.errors.length, 0),
    [reports]
  );
  const totalWarnings = useMemo(
    () => reports.reduce((acc, r) => acc + r.warnings.length, 0),
    [reports]
  );

  const toggleFileExpand = (path: string) => {
    const next = new Set(expandedFiles);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFiles(next);
  };

  const handleDiscardSingle = async (path: string) => {
    if (confirm(`Discard draft for "${path}"?`)) {
      await removePendingChange(path);
      await loadChangesAndValidate();
    }
  };

  const handleDiscardAll = async () => {
    if (confirm('Discard ALL pending changes across all sites? This cannot be undone.')) {
      await clearAllPendingChanges();
      setPendingChanges([]);
      setReports([]);
    }
  };

  const handleExecuteCommit = async () => {
    setCommitting(true);
    let store = getActiveStore();
    if (!store) store = new MockStore();

    try {
      const res = await store.commitBatch(pendingChanges, commitMessage);
      setCommitResult(res);
      if (res.success) {
        await clearAllPendingChanges();
        setIsConfirmOpen(false);

        // Fetch deploy status
        const dep = await store.getDeployStatus(res.commitSha);
        setDeployStatus(dep);
      }
    } catch (err: any) {
      alert('Commit failed: ' + err.message);
    } finally {
      setCommitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading pending changes and running dry-run validation...</div>;
  }

  if (commitResult?.success) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Changes Committed Successfully!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Commit SHA: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{commitResult.commitSha.slice(0, 7)}</code>
            {commitResult.rebased && <span className="ml-2 text-blue-600">(Automatically rebased on latest head)</span>}
          </p>
        </div>

        {commitResult.pullRequestUrl ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-2">
            <p className="font-semibold text-blue-900 dark:text-blue-200">Pull Request Created:</p>
            <a
              href={commitResult.pullRequestUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 underline flex items-center justify-center gap-1"
            >
              <span>{commitResult.pullRequestUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : commitResult.commitUrl ? (
          <div>
            <a
              href={commitResult.commitUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View commit on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : null}

        {deployStatus && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300">
            <strong>Deploy Status:</strong> {deployStatus.description}
          </div>
        )}

        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (pendingChanges.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Pending Changes</h2>
        <p className="text-xs text-slate-500">
          Your local drafts are clean and in sync with the remote repository.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-xs font-semibold hover:bg-slate-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Review Pending Changes
          </h1>
          <p className="text-xs text-slate-500">
            {pendingChanges.length} modified file{pendingChanges.length !== 1 ? 's' : ''} across {reports.length} target{reports.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleDiscardAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard All</span>
          </button>

          <button
            type="button"
            disabled={totalErrors > 0}
            onClick={() => setIsConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Commit Changes...</span>
          </button>
        </div>
      </div>

      {/* Validation Summary Callout */}
      {totalErrors > 0 ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>
              {totalErrors} validation error{totalErrors > 1 ? 's' : ''} detected. Commits are disabled until all errors are resolved.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All affected sites passed dry-run schema and template validation.</span>
        </div>
      )}

      {/* Per-Site Changes List with Diffs */}
      <div className="space-y-4">
        {reports.map((rep) => (
          <div
            key={rep.slug}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs"
          >
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {rep.slug === '_shared' ? 'Master Baseline Templates (_shared/)' : rep.slug}
                </span>
                <span className="text-[11px] text-slate-400">({rep.files.length} file{rep.files.length !== 1 ? 's' : ''})</span>
              </div>

              {rep.errors.length > 0 ? (
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{rep.errors.length} error{rep.errors.length !== 1 ? 's' : ''}</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid</span>
                </span>
              )}
            </div>

            {/* Errors on this site */}
            {rep.errors.length > 0 && (
              <div className="p-3 bg-red-50/60 dark:bg-red-950/20 border-b border-red-200 text-xs text-red-700 dark:text-red-300 space-y-1">
                {rep.errors.map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}

            {/* Files list */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rep.files.map((file) => {
                const isExpanded = expandedFiles.has(file.path);
                return (
                  <div key={file.path} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleFileExpand(file.path)}
                        className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span>{file.path}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDiscardSingle(file.path)}
                        className="text-[11px] text-slate-400 hover:text-red-600"
                      >
                        Discard
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-2">
                        <DiffView
                          oldTitle="Original"
                          newTitle="Draft"
                          oldText={file.oldContent}
                          newText={file.newContent}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Confirm Atomic Commit
            </h2>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <div><strong>Sites touched:</strong> {reports.length}</div>
              <div><strong>Files touched:</strong> {pendingChanges.length}</div>
              <div>This will create an atomic multi-file Git commit via the GitHub Git Data API.</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Commit Message</label>
              <textarea
                rows={2}
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-md font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={committing || !commitMessage.trim()}
                onClick={handleExecuteCommit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold shadow-xs"
              >
                {committing && <RotateCw className="w-3 h-3 animate-spin" />}
                <span>{committing ? 'Committing…' : 'Push Commit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

