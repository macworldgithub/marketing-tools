'use client';

import React, { useState, useEffect } from 'react';
import {
  percentageOf,
  whatPercentageOf,
  percentageOfWhat,
  increaseDecreaseBy,
  percentageChange,
  percentageDifference,
} from '../engines/percentage';
import { RotateCcw } from 'lucide-react';

export const Tool: React.FC = () => {
  // Panel 1: X% of Y
  const [p1X, setP1X] = useState<string>('15');
  const [p1Y, setP1Y] = useState<string>('200');

  // Panel 2: X is what % of Y
  const [p2X, setP2X] = useState<string>('30');
  const [p2Y, setP2Y] = useState<string>('200');

  // Panel 3: X is Y% of what
  const [p3X, setP3X] = useState<string>('30');
  const [p3Y, setP3Y] = useState<string>('15');

  // Panel 4: Increase/decrease Y by X%
  const [p4Y, setP4Y] = useState<string>('200');
  const [p4X, setP4X] = useState<string>('15');
  const [p4IsIncrease, setP4IsIncrease] = useState<boolean>(true);

  // Panel 5: % change from A to B
  const [p5A, setP5A] = useState<string>('50');
  const [p5B, setP5B] = useState<string>('75');

  // Panel 6: % difference between A and B
  const [p6A, setP6A] = useState<string>('50');
  const [p6B, setP6B] = useState<string>('75');

  const handleReset = () => {
    setP1X('15'); setP1Y('200');
    setP2X('30'); setP2Y('200');
    setP3X('30'); setP3Y('15');
    setP4Y('200'); setP4X('15'); setP4IsIncrease(true);
    setP5A('50'); setP5B('75');
    setP6A('50'); setP6B('75');
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const safeCalc = <T,>(fn: () => T, fallback: T = '—' as unknown as T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };

  const res1 = safeCalc(() => percentageOf(p1X, p1Y));
  const res2 = safeCalc(() => whatPercentageOf(p2X, p2Y));
  const res3 = safeCalc(() => percentageOfWhat(p3X, p3Y));
  const res4 = safeCalc(() => increaseDecreaseBy(p4Y, p4X, p4IsIncrease));
  const res5 = safeCalc(() => percentageChange(p5A, p5B), { change: '—', isIncrease: true });
  const res6 = safeCalc(() => percentageDifference(p6A, p6B));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm space-y-8">
      <div className="flex justify-end -mb-4">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset all percentage inputs to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Panel 1: X% of Y */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">1. Calculate Percentage of a Value</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>What is</span>
          <input
            type="text"
            value={p1X}
            onChange={(e) => setP1X(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>% of</span>
          <input
            type="text"
            value={p1Y}
            onChange={(e) => setP1Y(e.target.value)}
            className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>=</span>
          <span className="font-bold text-lg text-accent-primary px-2">{res1}</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Sentence: {p1X}% of {p1Y} is {res1}</p>
      </div>

      {/* Panel 2: X is what % of Y */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">2. What Percentage Is One Number of Another?</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="text"
            value={p2X}
            onChange={(e) => setP2X(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>is what % of</span>
          <input
            type="text"
            value={p2Y}
            onChange={(e) => setP2Y(e.target.value)}
            className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>=</span>
          <span className="font-bold text-lg text-accent-primary px-2">{res2}%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Sentence: {p2X} is {res2}% of {p2Y}</p>
      </div>

      {/* Panel 3: X is Y% of what */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">3. Find the Total (Base Value)</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="text"
            value={p3X}
            onChange={(e) => setP3X(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>is</span>
          <input
            type="text"
            value={p3Y}
            onChange={(e) => setP3Y(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>% of what? =</span>
          <span className="font-bold text-lg text-accent-primary px-2">{res3}</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Sentence: {p3X} is {p3Y}% of {res3}</p>
      </div>

      {/* Panel 4: Increase/decrease Y by X% */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">4. Increase or Decrease by Percentage</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <select
            value={p4IsIncrease ? 'increase' : 'decrease'}
            onChange={(e) => setP4IsIncrease(e.target.value === 'increase')}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
          <input
            type="text"
            value={p4Y}
            onChange={(e) => setP4Y(e.target.value)}
            className="w-24 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>by</span>
          <input
            type="text"
            value={p4X}
            onChange={(e) => setP4X(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>% =</span>
          <span className="font-bold text-lg text-accent-primary px-2">{res4}</span>
        </div>
      </div>

      {/* Panel 5: % change from A to B */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">5. Percentage Change (Directional)</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>From</span>
          <input
            type="text"
            value={p5A}
            onChange={(e) => setP5A(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>to</span>
          <input
            type="text"
            value={p5B}
            onChange={(e) => setP5B(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>=</span>
          <span className={`font-bold text-lg px-2 ${res5.isIncrease ? 'text-emerald-600' : 'text-red-600'}`}>
            {res5.isIncrease ? '+' : '-'}{res5.change}%
          </span>
          <span className="text-xs text-slate-500">({res5.isIncrease ? 'Increase' : 'Decrease'})</span>
        </div>
      </div>

      {/* Panel 6: % difference between A and B */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">6. Percentage Difference (Symmetric)</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>Difference between</span>
          <input
            type="text"
            value={p6A}
            onChange={(e) => setP6A(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>and</span>
          <input
            type="text"
            value={p6B}
            onChange={(e) => setP6B(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
          <span>=</span>
          <span className="font-bold text-lg text-accent-primary px-2">{res6}%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Symmetric calculation comparing against the average.</p>
      </div>
    </div>
  );
};