'use client';

import React, { useState } from 'react';
import { generateAddresses, addressesToCSV, AddressCountry, GeneratedAddress } from '../engines/address';

export const Tool: React.FC = () => {
  const [country, setCountry] = useState<AddressCountry>('US');
  const [count, setCount] = useState<number>(10);
  const [seed, setSeed] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const parsedSeed = seed.trim() !== '' ? parseInt(seed, 10) : undefined;
  const addresses: GeneratedAddress[] = generateAddresses({
    country,
    count,
    seed: isNaN(parsedSeed as number) ? undefined : parsedSeed,
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(addresses, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = addressesToCSV(addresses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-addresses-${country.toLowerCase()}-${addresses.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
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
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Seed (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 100"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          />
        </div>
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
              onClick={() => {
                navigator.clipboard.writeText(addr.fullAddress);
              }}
              className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Copy
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopyJson}
          className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-semibold transition-colors"
        >
          {copied ? 'Copied JSON!' : 'Copy JSON'}
        </button>
        <button
          onClick={handleDownloadCsv}
          className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
};