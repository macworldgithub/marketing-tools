'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateLorem } from '../engines/lorem';
import { RotateCw, Copy, Check } from 'lucide-react';

export const Tool: React.FC = () => {
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [asHtml, setAsHtml] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const output = useMemo(() => {
    return generateLorem({ type, count, startWithLorem, asHtml });
    // refreshCount is in dependencies to trigger new random variations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, count, startWithLorem, asHtml, refreshCount]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshCount((c) => c + 1);
    setTimeout(() => setIsRefreshing(false), 350);
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleRefresh();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Generate By</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Count ({type === 'words' ? '1–500' : '1–50'})
          </label>
          <input
            type="number"
            min={1}
            max={type === 'words' ? 500 : 50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(type === 'words' ? 500 : 50, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-col justify-end space-y-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={startWithLorem} onChange={(e) => setStartWithLorem(e.target.checked)} className="rounded" />
            <span>Start with "Lorem ipsum..."</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={asHtml} onChange={(e) => setAsHtml(e.target.checked)} className="rounded" />
            <span>Wrap in &lt;p&gt; tags</span>
          </label>
        </div>
      </div>

      {/* Output Header */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 px-1">
          <span>Generated Text ({output.split(/\s+/).filter(Boolean).length} words)</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-medium py-1 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Generate new placeholder text"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        <textarea
          value={output}
          readOnly
          rows={10}
          className="w-full p-3 font-serif text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold transition-colors min-h-[44px]"
          title="Refresh text without reloading whole website"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md text-sm font-semibold transition-colors min-h-[44px]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Lorem Ipsum'}</span>
        </button>
      </div>
    </div>
  );
};
