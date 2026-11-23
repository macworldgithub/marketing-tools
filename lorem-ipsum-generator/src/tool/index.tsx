'use client';

import React, { useState } from 'react';
import { generateLorem } from '../engines/lorem';

export const Tool: React.FC = () => {
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [asHtml, setAsHtml] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const output = generateLorem({ type, count, startWithLorem, asHtml });

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
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
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
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
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

      {/* Output */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>Generated Text</span>
          <span>{output.split(/\s+/).filter(Boolean).length} words</span>
        </div>
        <textarea
          value={output}
          readOnly
          rows={10}
          className="w-full p-3 font-serif text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {copied ? 'Copied to Clipboard!' : 'Copy Lorem Ipsum'}
      </button>
    </div>
  );
};