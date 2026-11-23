'use client';

import React, { useState } from 'react';
import { analyzeText } from '../engines/text-stats';
import { Copy, Check, RotateCcw } from 'lucide-react';

export const Tool: React.FC = () => {
  const [text, setText] = useState<string>('Hello, world! It\'s a well-known fact.');
  const [copied, setCopied] = useState<boolean>(false);

  const stats = analyzeText(text);

  const handleReset = () => {
    setText('Hello, world! It\'s a well-known fact.');
  };

  React.useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const platforms = [
    { name: 'X / Twitter', max: 280 },
    { name: 'SMS (GSM-7)', max: 160 },
    { name: 'SEO Title', max: 60 },
    { name: 'SEO Meta Description', max: 160 },
    { name: 'Instagram Bio', max: 150 },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="mb-4">
        <label htmlFor="char-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Enter or paste your text:
        </label>
        <textarea
          id="char-input"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your content here..."
          className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        />
      </div>

      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
            title="Reset to sample text"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setText('')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
          >
            <span>Clear Text</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-[44px]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy Text'}</span>
        </button>
      </div>

      {/* Main Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 text-center">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Characters</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.charactersWithSpaces}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">No Spaces</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.charactersWithoutSpaces}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Words</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.words}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Sentences</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.sentences}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Paragraphs</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.paragraphs}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Reading Time</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white pt-1">{stats.readingTimeText}</p>
        </div>
      </div>

      {/* Social Platform Limit Meters */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Limits</h4>
        {platforms.map((p) => {
          const remaining = p.max - stats.charactersWithSpaces;
          const isOver = remaining < 0;
          const pct = Math.min(100, Math.max(0, (stats.charactersWithSpaces / p.max) * 100));

          return (
            <div key={p.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{p.name}</span>
                <span className={isOver ? 'text-red-600 font-bold' : 'text-slate-500'}>
                  {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`} (max {p.max})
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${isOver ? 'bg-red-500' : 'bg-slate-600 dark:bg-slate-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};