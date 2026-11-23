'use client';

import React, { useState, useEffect } from 'react';
import { formatJSON, validateJSON, repairJSON, IndentOption } from '../engines/json';
import { RotateCw, RotateCcw } from 'lucide-react';

const DEFAULT_SAMPLE_JSON = '{\n  "b": 1,\n  "a": [1, 2, {"c": null}]\n}';

export const Tool: React.FC = () => {
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [indent, setIndent] = useState<IndentOption>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorPos, setErrorPos] = useState<{ line: number; column: number } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      setInput(DEFAULT_SAMPLE_JSON);
      setErrorMsg(null);
      setErrorPos(null);
    };
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const handleFormat = () => {
    try {
      const formatted = formatJSON(input, { indent, sortKeys, minify: false });
      setInput(formatted);
      setErrorMsg(null);
      setErrorPos(null);
    } catch (err: any) {
      const v = validateJSON(input);
      if (v.error) {
        setErrorMsg(v.error.message);
        setErrorPos({ line: v.error.line, column: v.error.column });
      } else {
        setErrorMsg(err.message || 'Formatting failed');
      }
    }
  };

  const handleMinify = () => {
    try {
      const minified = formatJSON(input, { sortKeys, minify: true });
      setInput(minified);
      setErrorMsg(null);
      setErrorPos(null);
    } catch (err: any) {
      const v = validateJSON(input);
      if (v.error) {
        setErrorMsg(v.error.message);
        setErrorPos({ line: v.error.line, column: v.error.column });
      }
    }
  };

  const handleRepair = () => {
    try {
      const res = repairJSON(input);
      setInput(res.repairedText);
      setErrorMsg(null);
      setErrorPos(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Repair failed');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[780px] mx-auto shadow-sm space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400">Indent:</span>
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value as IndentOption)}
              className="px-2 py-1 bg-white dark:bg-slate-800 border rounded"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="rounded" />
            <span>Sort Keys</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInput(DEFAULT_SAMPLE_JSON);
              setErrorMsg(null);
              setErrorPos(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset to sample JSON"
          >
            <RotateCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInput('');
              setErrorMsg(null);
              setErrorPos(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Clear text"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleRepair}
            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded font-medium hover:bg-amber-100"
          >
            Try to Repair
          </button>
          <button
            onClick={handleMinify}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100"
          >
            Minify
          </button>
          <button
            onClick={handleFormat}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold"
          >
            Format JSON
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400">
          <strong>Syntax Error:</strong> {errorMsg}
          {errorPos && <span className="ml-2 font-mono">(Line {errorPos.line}, Column {errorPos.column})</span>}
        </div>
      )}

      {/* Editor */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={14}
        className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        placeholder="Paste JSON here..."
      />

      {/* Bottom actions */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{input.length} characters</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50"
          >
            Download .json
          </button>
        </div>
      </div>
    </div>
  );
};
