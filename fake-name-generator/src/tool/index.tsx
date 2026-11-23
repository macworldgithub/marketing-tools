'use client';

import React, { useState } from 'react';
import { generateFakePeople, toCSV, FakePerson, LocaleKey, GenderOption } from '../engines/fake-data';

export const Tool: React.FC = () => {
  const [locale, setLocale] = useState<LocaleKey>('US');
  const [gender, setGender] = useState<GenderOption>('any');
  const [count, setCount] = useState<number>(10);
  const [seed, setSeed] = useState<string>('');
  const [includeEmail, setIncludeEmail] = useState<boolean>(true);
  const [includePhone, setIncludePhone] = useState<boolean>(true);
  const [includeUsername, setIncludeUsername] = useState<boolean>(true);
  const [includeDob, setIncludeDob] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const parsedSeed = seed.trim() !== '' ? parseInt(seed, 10) : undefined;
  const people: FakePerson[] = generateFakePeople({
    count,
    locale,
    gender,
    includeEmail,
    includePhone,
    includeUsername,
    includeDob,
    seed: isNaN(parsedSeed as number) ? undefined : parsedSeed,
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(people, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = toCSV(people);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fake-identities-${locale.toLowerCase()}-${people.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[820px] mx-auto shadow-sm space-y-6">
      {/* Notice */}
      <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-md text-xs text-teal-800 dark:text-teal-300">
        <strong>Fictional data for testing, mockups and games.</strong> Any resemblance to real people is coincidental. Does not generate real IDs or credit cards.
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Country / Locale</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleKey)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="India">India</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as GenderOption)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="any">Random / Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity (1–100)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Seed (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 42"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Fields Toggle */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-200 dark:border-slate-700">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeEmail} onChange={(e) => setIncludeEmail(e.target.checked)} className="rounded" />
          <span>Email</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includePhone} onChange={(e) => setIncludePhone(e.target.checked)} className="rounded" />
          <span>Phone</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeUsername} onChange={(e) => setIncludeUsername(e.target.checked)} className="rounded" />
          <span>Username</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeDob} onChange={(e) => setIncludeDob(e.target.checked)} className="rounded" />
          <span>Date of Birth</span>
        </label>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md max-h-[420px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="p-2.5">Name</th>
              <th className="p-2.5">Gender</th>
              {includeUsername && <th className="p-2.5">Username</th>}
              {includeEmail && <th className="p-2.5">Email</th>}
              {includePhone && <th className="p-2.5">Phone</th>}
              {includeDob && <th className="p-2.5">DOB</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {people.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="p-2.5 font-medium">{p.fullName}</td>
                <td className="p-2.5 text-slate-500">{p.gender}</td>
                {includeUsername && <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{p.username}</td>}
                {includeEmail && <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{p.email}</td>}
                {includePhone && <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{p.phone}</td>}
                {includeDob && <td className="p-2.5 text-slate-500">{p.dateOfBirth}</td>}
              </tr>
            ))}
          </tbody>
        </table>
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