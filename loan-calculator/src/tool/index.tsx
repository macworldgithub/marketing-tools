'use client';

import React, { useState } from 'react';
import { calculateLoan, LoanResult } from '../engines/loan';
import { Download, RotateCcw, Copy, Check, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export const Tool: React.FC = () => {
  const [amount, setAmount] = useState<string>('10000');
  const [rate, setRate] = useState<string>('6');
  const [termYears, setTermYears] = useState<string>('3');
  const [termMonths, setTermMonths] = useState<string>('36');
  const [isYears, setIsYears] = useState<boolean>(true);
  const [extraPayment, setExtraPayment] = useState<string>('0');
  const [currency, setCurrency] = useState<string>('$');
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const months = isYears ? (parseInt(termYears, 10) || 1) * 12 : (parseInt(termMonths, 10) || 1);

  let result: LoanResult | null = null;
  let error: string | null = null;

  try {
    if (amount && rate && months > 0) {
      result = calculateLoan({
        amount,
        annualRatePct: rate,
        termMonths: months,
        extraMonthlyPayment: extraPayment || 0,
      });
    }
  } catch (err: any) {
    error = err.message || 'Invalid calculation values.';
  }

  const handleDownloadCsv = () => {
    if (!result || result.schedule.length === 0) return;
    const header = 'Period,Payment,Principal,Interest,Remaining Balance\n';
    const rows = result.schedule
      .map((s) => `${s.period},${s.payment},${s.principal},${s.interest},${s.remainingBalance}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loan-amortization-schedule.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Monthly Payment: ${currency}${result.monthlyPayment} | Total Interest: ${currency}${result.totalInterest} | Total Paid: ${currency}${result.totalPaid}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Loan Amount ({currency})
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Interest Rate (APR %)
          </label>
          <div className="relative">
            <input
              type="text"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full pr-8 pl-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loan Term</label>
            <button
              type="button"
              onClick={() => setIsYears(!isYears)}
              className="text-xs text-accent-primary hover:underline"
            >
              Switch to {isYears ? 'Months' : 'Years'}
            </button>
          </div>
          {isYears ? (
            <input
              type="number"
              min="1"
              value={termYears}
              onChange={(e) => setTermYears(e.target.value)}
              placeholder="e.g. 3"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
            />
          ) : (
            <input
              type="number"
              min="1"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              placeholder="e.g. 36"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Extra Monthly Payment (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
              Estimated Monthly Payment
            </span>
            <div className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              {currency}{result.monthlyPayment}
            </div>
            <p className="text-xs text-slate-500">
              Final payment: {currency}{result.finalPayment}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <span className="text-xs text-slate-500">Total Interest</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{currency}{result.totalInterest}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <span className="text-xs text-slate-500">Total Cost of Loan</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{currency}{result.totalPaid}</p>
            </div>
          </div>

          {result.interestSaved && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 text-sm">
              <strong>Extra Payment Impact:</strong> Saves <strong>{currency}{result.interestSaved}</strong> in interest and pays off <strong>{result.monthsSaved} months earlier</strong>!
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-primary hover:underline min-h-[44px]"
            >
              <span>{showSchedule ? 'Hide' : 'View'} Amortization Schedule</span>
              {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-[44px]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>

          {showSchedule && (
            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Payment</th>
                    <th className="p-2.5">Principal</th>
                    <th className="p-2.5">Interest</th>
                    <th className="p-2.5">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.schedule.map((s) => (
                    <tr key={s.period} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5">{s.period}</td>
                      <td className="p-2.5">{currency}{s.payment}</td>
                      <td className="p-2.5">{currency}{s.principal}</td>
                      <td className="p-2.5">{currency}{s.interest}</td>
                      <td className="p-2.5">{currency}{s.remainingBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};