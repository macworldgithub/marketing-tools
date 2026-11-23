'use client';

import React, { useState } from 'react';
import { sortList, SortOptions } from '../engines/sorter';

export const Tool: React.FC = () => {
  const [input, setInput] = useState<string>('banana, Apple, cherry, apple, 10, 2');
  const [delimiter, setDelimiter] = useState<'newline' | 'comma' | 'semicolon' | 'space'>('comma');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [caseInsensitive, setCaseInsensitive] = useState<boolean>(true);
  const [numeric, setNumeric] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);
  const [sortByLastWord, setSortByLastWord] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const result = sortList(input, {
    delimiter,
    order,
    caseInsensitive,
    numeric,
    removeDuplicates,
    sortByLastWord,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as any)}
            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border rounded"
          >
            <option value="newline">New Line</option>
            <option value="comma">Comma (,)</option>
            <option value="semicolon">Semicolon (;)</option>
            <option value="space">Space</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Order</label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as any)}
            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border rounded"
          >
            <option value="asc">A → Z (Ascending)</option>
            <option value="desc">Z → A (Descending)</option>
          </select>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={numeric} onChange={(e) => setNumeric(e.target.checked)} className="rounded" />
            <span>Natural Numbers (2 &lt; 10)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} className="rounded" />
            <span>Case Insensitive</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={removeDuplicates} onChange={(e) => setRemoveDuplicates(e.target.checked)} className="rounded" />
            <span>Remove Duplicates</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={sortByLastWord} onChange={(e) => setSortByLastWord(e.target.checked)} className="rounded" />
            <span>Sort by Last Word</span>
          </label>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Input Items
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          placeholder="Enter items to sort..."
        />
      </div>

      {/* Output */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>
            Sorted Output ({result.totalItems} items
            {result.duplicatesRemoved > 0 && `, ${result.duplicatesRemoved} duplicates removed`})
          </span>
        </div>
        <textarea
          value={result.output}
          readOnly
          rows={6}
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Copy */}
      <button
        onClick={handleCopy}
        disabled={!result.output}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {copied ? 'Copied Sorted List!' : 'Copy Sorted List'}
      </button>
    </div>
  );
};