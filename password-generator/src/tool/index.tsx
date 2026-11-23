'use client';

import React, { useState } from 'react';
import { generatePassword, generatePIN, GeneratedPassword } from '../engines/password';
import { RefreshCw, Copy, Check, Shield } from 'lucide-react';

export const Tool: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [length, setLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const getResults = (): GeneratedPassword[] => {
    try {
      if (mode === 'pin') {
        return generatePIN(length, 1);
      }
      return generatePassword({
        length,
        includeUppercase: includeUpper,
        includeLowercase: includeLower,
        includeNumbers: includeNumbers,
        includeSymbols: includeSymbols,
        excludeAmbiguous,
        count: 1,
      });
    } catch {
      return [{ value: 'Select at least one set', entropyBits: 0, strength: 'Weak' }];
    }
  };

  const [passwords, setPasswords] = useState<GeneratedPassword[]>(() => getResults());

  const handleRegenerate = () => {
    setPasswords(getResults());
    setCopiedIdx(null);
  };

  const handleCopy = (val: string, idx: number) => {
    navigator.clipboard.writeText(val);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const current = passwords[0];

  const getStrengthBadgeClass = (str: string) => {
    switch (str) {
      case 'Very strong':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'Strong':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'Good':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300';
      case 'Fair':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => { setMode('password'); setLength(16); }}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              mode === 'password' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('pin'); setLength(6); }}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              mode === 'pin' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            PIN Code
          </button>
        </div>
      </div>

      {/* Generated Display Box */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-slate-900 dark:text-white break-all select-all">
          {current.value}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRegenerate}
            title="Generate new"
            className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleCopy(current.value, 0)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 min-h-[44px]"
          >
            {copiedIdx === 0 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedIdx === 0 ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Strength & Entropy Indicator */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent-primary" />
          <span className="text-slate-600 dark:text-slate-400">Entropy:</span>
          <strong className="text-slate-900 dark:text-white">{current.entropyBits} bits</strong>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getStrengthBadgeClass(current.strength)}`}>
          {current.strength}
        </span>
      </div>

      {/* Length Slider */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <label className="font-medium text-slate-700 dark:text-slate-300">
            {mode === 'password' ? 'Password Length' : 'PIN Digits'}: {length}
          </label>
        </div>
        <input
          type="range"
          min={mode === 'password' ? 8 : 4}
          max={mode === 'password' ? 64 : 12}
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value, 10))}
          className="w-full accent-accent-primary"
        />
      </div>

      {/* Checkbox Options (Password Mode) */}
      {mode === 'password' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={includeUpper}
              onChange={(e) => setIncludeUpper(e.target.checked)}
              className="w-4 h-4 text-accent-primary rounded"
            />
            <span>Uppercase Letters (A-Z)</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={includeLower}
              onChange={(e) => setIncludeLower(e.target.checked)}
              className="w-4 h-4 text-accent-primary rounded"
            />
            <span>Lowercase Letters (a-z)</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="w-4 h-4 text-accent-primary rounded"
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="w-4 h-4 text-accent-primary rounded"
            />
            <span>Symbols (!@#$%^&*)</span>
          </label>

          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="w-4 h-4 text-accent-primary rounded"
            />
            <span>Exclude Ambiguous Characters (I, l, 1, O, 0)</span>
          </label>
        </div>
      )}
    </div>
  );
};