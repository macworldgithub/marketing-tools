'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateAddresses, addressesToCSV, AddressCountry, GeneratedAddress } from '../engines/address';
import { RotateCw, Copy, Check, Download } from 'lucide-react';

export const Tool: React.FC = () => {
  const [country, setCountry] = useState<AddressCountry>('US');
  const [count, setCount] = useState<number>(10);
  const [seed, setSeed] = useState<string>('');
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const parsedSeed = seed.trim() !== '' ? parseInt(seed, 10) : undefined;

  // Re-generate whenever country, count, parsedSeed, or refreshCount changes
  const addresses: GeneratedAddress[] = useMemo(() => {
    return generateAddresses({
      country,
      count,
      seed: isNaN(parsedSeed as number) ? undefined : parsedSeed,
    });
    // refreshCount is intentionally in dependencies to trigger re-computation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, count, parsedSeed, refreshCount]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (seed.trim() !== '') {
      const num = parseInt(seed, 10);
      if (!isNaN(num)) {
        setSeed(String(num + 1));
      } else {
        setSeed('');
      }
    }
    setRefreshCount((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 350);
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleRefresh();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(addresses, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopySingle = (fullAddress: string, idx: number) => {
    navigator.clipboard.writeText(fullAddress);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleDownloadCsv = () => {
    const csv = addressesToCSV(addresses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-addresses-${country.toLowerCase()}-${addresses.length}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[800px] mx-auto shadow-sm space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md text-xs text-amber-800 dark:text-amber-300">
        <strong>Disclaimer:</strong> Randomly generated placeholder addresses for testing and design mockups. They are not verified and may coincide with real addresses by chance. Do not use them for forms, shipping or identity purposes.
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as AddressCountry)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="US">United States (State-ZIP Aligned)</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada (FSA Format)</option>
            <option value="Australia">Australia</option>
            <option value="India">India (6-Digit PIN)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Count (1–50)</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Seed (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 100"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Address List Header with Refresh */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
          <span className="font-medium">Generated Addresses ({addresses.length})</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-medium py-1 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Generate new addresses"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Address List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
          {addresses.map((addr, idx) => (
            <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{addr.streetAddress}</div>
                <div className="text-slate-500">
                  {addr.city}, {addr.stateOrProvince} {addr.postalCode}, {addr.country}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(addr.fullAddress, idx)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold transition-colors min-h-[44px]"
          title="Refresh addresses without reloading page"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onClick={handleCopyJson}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-semibold transition-colors min-h-[44px]"
        >
          {copiedJson ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied JSON!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy JSON</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>
    </div>
  );
};
