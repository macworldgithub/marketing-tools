'use client';

import React, { useState, useId } from 'react';
import { calculateAge, parseDateString, AgeResult } from '../engines/age';
import { RotateCcw, Copy, Check, Calendar, AlertCircle } from 'lucide-react';

export const Tool: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [birthDate, setBirthDate] = useState<string>('1990-05-15');
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const [copied, setCopied] = useState<boolean>(false);

  const birthId = useId();
  const targetId = useId();

  let result: AgeResult | null = null;
  let error: string | null = null;

  try {
    if (birthDate && targetDate) {
      const from = parseDateString(birthDate);
      const to = parseDateString(targetDate);
      result = calculateAge(from, to);
    }
  } catch (err: any) {
    error = err.message || 'Invalid date entered.';
  }

  const handleReset = () => {
    setBirthDate('');
    setTargetDate(todayStr);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Age: ${result.years} years, ${result.months} months, ${result.days} days (${result.totalDays.toLocaleString()} total days)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor={birthId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Date of Birth
          </label>
          <input
            id={birthId}
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor={targetId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Age at the Date of
          </label>
          <input
            id={targetId}
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-md min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        {result && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Age'}</span>
          </button>
        )}
      </div>

      {result && !error && (
        <div aria-live="polite" className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg p-6 text-center">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Exact Age
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white my-2">
              {result.years} <span className="text-xl sm:text-2xl font-medium text-slate-500">years</span> {result.months} <span className="text-xl sm:text-2xl font-medium text-slate-500">m</span> {result.days} <span className="text-xl sm:text-2xl font-medium text-slate-500">d</span>
            </div>
            <p className="text-xs text-slate-500">
              Born on a <strong className="text-slate-700 dark:text-slate-300">{result.dayOfWeekBorn}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <span className="text-xs text-slate-500">Total Days</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{result.totalDays.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <span className="text-xs text-slate-500">Total Weeks</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{result.totalWeeks.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <span className="text-xs text-slate-500">Total Months</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{result.totalMonths.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <span className="text-xs text-slate-500">Next Birthday</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{result.daysUntilNextBirthday} days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};