'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getActiveStore, MockStore } from '../../src/lib/store';
import { setPendingChange } from '../../src/lib/store/pending';
import { CommitHistoryItem } from '../../src/lib/store/types';
import { DiffView } from '../../src/components/DiffView';
import {
  History,
  RotateCcw,
  GitCommit,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

function HistoryInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const filePath = searchParams.get('path') || (slug ? `${slug}/content/privacy.md` : '_shared/privacy.master.md');

  const [loading, setLoading] = useState<boolean>(true);
  const [commits, setCommits] = useState<CommitHistoryItem[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [historicalContent, setHistoricalContent] = useState<string>('');
  const [fetchingDiff, setFetchingDiff] = useState<boolean>(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      let store = getActiveStore();
      if (!store) store = new MockStore();

      try {
        const hist = await store.history(filePath);
        setCommits(hist);

        const current = await store.readFile(filePath).catch(() => '');
        setCurrentContent(current);
      } catch {}
      setLoading(false);
    };

    loadHistory();
  }, [filePath]);

  const handleSelectCommit = async (sha: string) => {
    setSelectedCommit(sha);
    setFetchingDiff(true);
    let store = getActiveStore();
    if (!store) store = new MockStore();

    try {
      const old = await store.restore(filePath, sha);
      setHistoricalContent(old);
    } catch {
      setHistoricalContent('');
    } finally {
      setFetchingDiff(false);
    }
  };

  const handleRestoreVersion = async (sha: string) => {
    if (confirm(`Restore content from commit ${sha.slice(0, 7)} as a new pending change?`)) {
      await setPendingChange(filePath, historicalContent);
      alert(`Staged historical version of ${filePath} as a new pending draft. Review and commit it when ready.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href={slug ? `/site/?slug=${slug}` : '/'}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>Version History & Rollback</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{filePath}</p>
          </div>
        </div>

        <Link
          href="/review/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Pending Changes</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading commit history...</div>
      ) : commits.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-400">No commits found for {filePath}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Commit list */}
          <div className="md:col-span-1 space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commits</h2>
            <div className="space-y-1.5">
              {commits.map((c) => {
                const isSelected = selectedCommit === c.sha;
                return (
                  <button
                    key={c.sha}
                    type="button"
                    onClick={() => handleSelectCommit(c.sha)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 font-medium shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold line-clamp-1">{c.message}</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-mono">
                      <span>{c.sha.slice(0, 7)}</span>
                      <span>{c.date.slice(0, 10)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diff & Restore Pane */}
          <div className="md:col-span-2 space-y-4">
            {selectedCommit ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Comparing Current vs Commit {selectedCommit.slice(0, 7)}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Restoring stages this version as a new pending change. It never rewrites Git history.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestoreVersion(selectedCommit)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore this version</span>
                  </button>
                </div>

                {fetchingDiff ? (
                  <div className="py-12 text-center text-xs text-slate-400">Fetching historical blob...</div>
                ) : (
                  <DiffView
                    oldTitle={`Commit ${selectedCommit.slice(0, 7)}`}
                    newTitle="Current Head"
                    oldText={historicalContent}
                    newText={currentContent}
                  />
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                Select a commit on the left to view diff and restore.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading history...</div>}>
      <HistoryInner />
    </Suspense>
  );
}

