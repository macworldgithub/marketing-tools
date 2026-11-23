'use client';

import React, { useState, useEffect } from 'react';
import { calculateLoan, formatCurrency } from '../engines/loan';
import { RotateCcw } from 'lucide-react';

export const Tool: React.FC = () => {
  const [amount, setAmount] = useState<string>('1000000');
  const [rate, setRate] = useState<string>('9');
  const [tenureYears, setTenureYears] = useState<string>('5');
  const [currency, setCurrency] = useState<string>('INR');
  const [isFlatRate, setIsFlatRate] = useState<boolean>(false);

  const handleReset = () => {
    setAmount('1000000');
    setRate('9');
    setTenureYears('5');
    setIsFlatRate(false);
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const months = Math.max(1, Math.round(parseFloat(tenureYears) * 12 || 12));
  let result: ReturnType<typeof calculateLoan> | null = null;
  let calcError = '';

  try {
    result = calculateLoan({
      amount: amount || '0',
      annualRatePct: rate || '0',
      termMonths: months,
      isFlatRate,
    });
  } catch (err: any) {
    calcError = err.message || 'Calculation error';
  }

  const pNum = parseFloat(amount) || 0;
  const intNum = result ? parseFloat(result.totalInterest) : 0;
  const totalNum = result ? parseFloat(result.totalPaid) : 0;
  const pPct = totalNum > 0 ? (pNum / totalNum) * 100 : 50;

  const handleDownloadCsv = () => {
    if (!result || result.schedule.length === 0) return;
    const headers = ['Month', 'EMI', 'Principal', 'Interest', 'Remaining Balance'];
    const rows = result.schedule.map((s: any) => [s.period, s.payment, s.principal, s.interest, s.remainingBalance]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emi-amortization-schedule.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Currency & Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400">Currency:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border rounded font-medium"
          >
            <option value="INR">₹ INR (Lakh/Crore)</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isFlatRate}
              onChange={(e) => setIsFlatRate(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>Flat Rate Mode</span>
          </label>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset to default EMI values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Loan Amount ({currency})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Interest Rate (% p.a.)
          </label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tenure (Years)
          </label>
          <input
            type="number"
            step="0.5"
            value={tenureYears}
            onChange={(e) => setTenureYears(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          />
        </div>
      </div>

      {/* Summary Banner */}
      {result && (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Monthly EMI ({isFlatRate ? 'Flat Rate' : 'Reducing Balance'})
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {currency === 'INR' ? '₹ ' : '$ '}
            {formatCurrency(result.monthlyPayment, currency)}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-500 block">Total Interest</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(result.totalInterest, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Payment (P + I)</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatCurrency(result.totalPaid, currency)}
              </span>
            </div>
          </div>

          {/* Breakdown bar */}
          <div className="pt-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div style={{ width: `${pPct}%` }} className="bg-emerald-600 h-full" title="Principal" />
              <div style={{ width: `${100 - pPct}%` }} className="bg-slate-400 dark:bg-slate-500 h-full" title="Interest" />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Principal: {pPct.toFixed(1)}%</span>
              <span>Interest: {(100 - pPct).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Schedule export */}
      {result && result.schedule.length > 0 && (
        <div className="pt-2">
          <button
            onClick={handleDownloadCsv}
            className="w-full py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Download {result.schedule.length}-Month Repayment Schedule (CSV)
          </button>
        </div>
      )}
    </div>
  );
};