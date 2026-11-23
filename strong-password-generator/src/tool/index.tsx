'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  generatePassword,
  generatePassphrase,
  calculateEntropy,
  getStrengthLabel,
  GeneratedPassword,
} from '../engines/password';
import { RotateCw, Copy, Check } from 'lucide-react';

export const Tool: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [length, setLength] = useState<number>(20);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(5);
  const [separator, setSeparator] = useState<string>('-');
  const [capitalize, setCapitalize] = useState<boolean>(true);
  const [count, setCount] = useState<number>(5);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const passwords: GeneratedPassword[] = useMemo(() => {
    try {
      if (mode === 'password') {
        return generatePassword({
          length,
          includeUppercase: useUpper,
          includeLowercase: useLower,
          includeNumbers: useNumbers,
          includeSymbols: useSymbols,
          excludeAmbiguous,
          count,
        });
      } else {
        return generatePassphrase({
          wordCount,
          separator,
          capitalize,
          count,
        });
      }
    } catch (err) {
      return [];
    }
    // refreshCount is in dependencies to trigger new random passwords
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, wordCount, separator, capitalize, count, refreshCount]);

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

  const primary = passwords[0];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Mode toggle */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMode('password')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            mode === 'password'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Random Password (High Entropy)
        </button>
        <button
          onClick={() => setMode('passphrase')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            mode === 'passphrase'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Passphrase Mode (EFF Words)
        </button>
      </div>

      {/* Primary Display */}
      {primary && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <span className="font-mono text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-all">
              {primary.value}
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded text-xs font-semibold transition-colors"
                title="Generate new password"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(primary.value, 0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold whitespace-nowrap transition-colors"
              >
                {copiedIdx === 0 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIdx === 0 ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Entropy: <strong className="text-slate-800 dark:text-slate-200">{primary.entropyBits} bits</strong></span>
            <span>•</span>
            <span className={`font-semibold ${
              primary.strength === 'Very strong'
                ? 'text-emerald-600 dark:text-emerald-400'
                : primary.strength === 'Strong'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-amber-600'
            }`}>
              {primary.strength}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      {mode === 'password' ? (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span>Length</span>
              <span className="font-bold">{length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} className="rounded" />
              <span>A–Z Upper</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} className="rounded" />
              <span>a–z Lower</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} className="rounded" />
              <span>0–9 Numbers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} className="rounded" />
              <span>Symbols (!@#)</span>
            </label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={excludeAmbiguous} onChange={(e) => setExcludeAmbiguous(e.target.checked)} className="rounded" />
            <span>Exclude ambiguous characters (I, l, 1, O, 0)</span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Word Count</label>
              <input
                type="number"
                min="3"
                max="10"
                value={wordCount}
                onChange={(e) => setWordCount(Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Separator</label>
              <input
                type="text"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} className="rounded" />
                <span>Capitalize Words</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Passwords List */}
      {passwords.length > 1 && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-medium text-slate-500">Alternative Options</label>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {passwords.slice(1).map((p, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <span className="font-mono text-slate-800 dark:text-slate-200 truncate pr-3">{p.value}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(p.value, idx + 1)}
                  className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 font-medium"
                >
                  {copiedIdx === idx + 1 ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
