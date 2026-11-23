import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');

function writeToolContent(
  slug: string,
  siteJson: any,
  faqs: { id: string; question: string; answer: string }[],
  explainerMd: string
) {
  const dir = path.join(ROOT_DIR, slug, 'content');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'site.json'), JSON.stringify(siteJson, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'faqs.json'), JSON.stringify({ schemaVersion: 1, items: faqs }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'explainer.md'), explainerMd.trim(), 'utf-8');
}

function writeToolComponent(slug: string, tsxCode: string) {
  const dir = path.join(ROOT_DIR, slug, 'src', 'tool');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'index.tsx');
  fs.writeFileSync(file, tsxCode.trim(), 'utf-8');
}

// ============================================================================
// 19. ADDRESS GENERATOR
// ============================================================================
const addressSite = {
  schemaVersion: 1,
  slug: 'address-generator',
  siteName: 'Address Generator',
  toolName: 'Address Generator',
  primaryKeyword: 'address generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate formatted placeholder addresses with valid regional postal code ranges for software testing and UI mockups.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'teal',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const addressFaqs = [
  {
    id: 'are-generated-addresses-real-places',
    question: 'Are generated addresses verified physical locations?',
    answer: 'No. Addresses are assembled algorithmically from bundled geographic databases using valid postal code formats and regional naming conventions. Any coincidence with real residential or commercial premises is unintended.'
  },
  {
    id: 'do-us-zip-codes-match-states',
    question: 'Do US ZIP codes correspond to the generated state?',
    answer: 'Yes. The generator checks a state-to-ZIP prefix lookup table so that California addresses receive 90001–96162, New York gets 10001–14925, and Texas gets 75001–79999.'
  },
  {
    id: 'supported-international-countries',
    question: 'Which countries are supported?',
    answer: 'The generator supports the United States, United Kingdom (correct outward/inward postcode formats), Canada (FSA LDU pattern), Australia, and India (6-digit PIN codes).'
  },
  {
    id: 'exporting-address-lists',
    question: 'Can I export addresses to CSV or JSON?',
    answer: 'Yes. You can instantly export up to 50 addresses at a time to comma-separated CSV or structured JSON format.'
  },
  {
    id: 'can-i-use-for-shipping-or-checkout',
    question: 'Can I use these addresses for actual shipping or orders?',
    answer: 'Strictly no. These addresses are intended solely for development testing and design mockups. Never use them for real billing, shipping, or government submissions.'
  }
];

const addressExplainer = `
# How Address Generator Works

The Address Generator creates syntactically valid placeholder addresses across multiple countries for user interface prototyping, form validation testing, and database population.

## Regional Formatting Standards
- **United States:** Formats as \`Street, City, State ZIP\`. ZIP codes are constrained to state-specific numeric allocations.
- **United Kingdom:** Uses the alphanumeric postcode standard (\`A1 1AA\` or \`AA1 1AA\`) with matching English and Scottish regional municipalities.
- **Canada:** Follows the Forward Sortation Area (FSA) and Local Delivery Unit (LDU) pattern \`A1A 1A1\`.
- **Australia & India:** Adheres to Australian 4-digit state postal bands and Indian 6-digit postal index numbers (PIN).
`;

const addressToolTsx = `'use client';

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
    a.download = \`sample-addresses-\${country.toLowerCase()}-\${addresses.length}.csv\`;
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
`;

writeToolContent('address-generator', addressSite, addressFaqs, addressExplainer);
writeToolComponent('address-generator', addressToolTsx);
console.log('✓ Populated address-generator');

// ============================================================================
// 20. ALPHABETICAL ORDER SORTER
// ============================================================================
const sorterSite = {
  schemaVersion: 1,
  slug: 'alphabetical-order-sorter',
  siteName: 'Alphabetical Order Sorter',
  toolName: 'Alphabetical Order Sorter',
  primaryKeyword: 'alphabetical order sorter',
  domain: 'TODO-set-domain.com',
  tagline: 'Sort lists alphabetically, numerically, or by last word with delimiter controls and duplicate removal.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'blue',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const sorterFaqs = [
  {
    id: 'how-does-natural-numeric-sorting-work',
    question: 'What is natural numeric sorting?',
    answer: 'Standard alphabetical sorting places "10" before "2". Natural sorting treats embedded numbers as quantities so that 2 comes before 10.'
  },
  {
    id: 'stable-sorting-guarantee',
    question: 'Is the sorting algorithm stable?',
    answer: 'Yes. When items compare equal (for instance, case-insensitive duplicates like "Apple" and "apple"), their original relative order is strictly preserved.'
  },
  {
    id: 'how-does-duplicate-removal-work',
    question: 'How does duplicate removal handle letter casing?',
    answer: 'When duplicate removal is enabled with case-insensitivity, the tool keeps the very first occurrence found in the list and removes subsequent variants.'
  },
  {
    id: 'sorting-by-last-name-or-word',
    question: 'Can I sort a list of full names by last name?',
    answer: 'Yes. Enabling "Sort by Last Word" extracts the trailing word of each entry (such as the surname) to collate names alphabetically.'
  },
  {
    id: 'delimiters-supported',
    question: 'What input delimiters can I use?',
    answer: 'You can split items by line breaks, commas, semicolons, whitespace, tabs, or a custom delimiter string.'
  }
];

const sorterExplainer = `
# How Alphabetical Order Sorter Works

The Alphabetical Order Sorter organizes lists of words, names, and numbers into ordered sequences using international Unicode Collation via \`Intl.Collator\`.

## Natural Numbers & International Collation
By enabling numeric collation, numerical values within strings are compared mathematically rather than by character code point (e.g. \`2\` appears before \`10\`).

## Stable Sorting & Duplicate Tracking
- **Stability:** Equals maintain their exact initial order.
- **Deduplication:** Tracks and removes case-insensitive repetitions, reporting total items and unique counts live.
- **Last Word Collation:** Sorts bibliography entries, citations, and names by their final word cleanly.
`;

const sorterToolTsx = `'use client';

import React, { useState } from 'react';
import { sortList, SortOptions } from '../engines/sorter';

export const Tool: React.FC = () => {
  const [input, setInput] = useState<string>('banana, Apple, cherry, apple, 10, 2');
  const [delimiter, setDelimiter] = useState<'newline' | 'comma' | 'semicolon' | 'space'>('comma');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [caseInsensitive, setCaseInsensitive] = useState<boolean>(true);
  const [numeric, setNumeric] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);
  const [sortByLastWord, setSortByLastWord] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const result = sortList(input, {
    delimiter,
    order,
    caseInsensitive,
    numeric,
    removeDuplicates,
    sortByLastWord,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as any)}
            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border rounded"
          >
            <option value="newline">New Line</option>
            <option value="comma">Comma (,)</option>
            <option value="semicolon">Semicolon (;)</option>
            <option value="space">Space</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Order</label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as any)}
            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border rounded"
          >
            <option value="asc">A → Z (Ascending)</option>
            <option value="desc">Z → A (Descending)</option>
          </select>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={numeric} onChange={(e) => setNumeric(e.target.checked)} className="rounded" />
            <span>Natural Numbers (2 &lt; 10)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} className="rounded" />
            <span>Case Insensitive</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={removeDuplicates} onChange={(e) => setRemoveDuplicates(e.target.checked)} className="rounded" />
            <span>Remove Duplicates</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={sortByLastWord} onChange={(e) => setSortByLastWord(e.target.checked)} className="rounded" />
            <span>Sort by Last Word</span>
          </label>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Input Items
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          placeholder="Enter items to sort..."
        />
      </div>

      {/* Output */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>
            Sorted Output ({result.totalItems} items
            {result.duplicatesRemoved > 0 && \`, \${result.duplicatesRemoved} duplicates removed\`})
          </span>
        </div>
        <textarea
          value={result.output}
          readOnly
          rows={6}
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Copy */}
      <button
        onClick={handleCopy}
        disabled={!result.output}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {copied ? 'Copied Sorted List!' : 'Copy Sorted List'}
      </button>
    </div>
  );
};
`;

writeToolContent('alphabetical-order-sorter', sorterSite, sorterFaqs, sorterExplainer);
writeToolComponent('alphabetical-order-sorter', sorterToolTsx);
console.log('✓ Populated alphabetical-order-sorter');

// ============================================================================
// 21. EMI CALCULATOR
// ============================================================================
const emiSite = {
  schemaVersion: 1,
  slug: 'emi-calculator',
  siteName: 'EMI Calculator',
  toolName: 'EMI Calculator',
  primaryKeyword: 'emi calculator',
  domain: 'TODO-set-domain.com',
  tagline: 'Calculate Equated Monthly Installments for home, car, and personal loans with reducing-balance and flat-rate modes.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'emerald',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const emiFaqs = [
  {
    id: 'how-is-reducing-balance-emi-calculated',
    question: 'How is reducing-balance EMI calculated?',
    answer: 'Reducing-balance EMI uses the standard financial formula: EMI = [P × r × (1+r)^n] / [(1+r)^n - 1], where P is principal, r is the monthly interest rate (annual rate / 12 / 100), and n is the tenure in months.'
  },
  {
    id: 'reducing-balance-vs-flat-rate',
    question: 'What is the difference between reducing balance and flat rate?',
    answer: 'In flat-rate loans, interest is charged on the original principal for the entire loan duration, resulting in a substantially higher effective interest cost compared to a reducing-balance loan of the same nominal rate.'
  },
  {
    id: 'indian-number-system-lakh-crore',
    question: 'How does the Indian Lakh / Crore numbering system work?',
    answer: 'When Indian Rupee (INR) is selected, figures are grouped in the South Asian format: 1,00,000 (1 Lakh) and 1,00,00,000 (1 Crore) using the en-IN formatting locale.'
  },
  {
    id: 'can-i-download-the-schedule',
    question: 'Can I download the month-by-month repayment schedule?',
    answer: 'Yes. You can export the complete repayment schedule as a CSV spreadsheet detailing principal, interest, and outstanding balance for every installment.'
  },
  {
    id: 'zero-interest-emi',
    question: 'Does this calculator support 0% interest no-cost EMIs?',
    answer: 'Yes. If the interest rate is set to 0%, the monthly EMI simplifies exactly to Principal divided by tenure without division-by-zero errors.'
  }
];

const emiExplainer = `
# How EMI Calculator Works

The Equated Monthly Installment (EMI) Calculator models loan amortizations under reducing-balance and flat-rate credit structures using arbitrary-precision decimal arithmetic.

## Mathematical Formulation
- **Reducing Balance Formula:**
  $$\\text{EMI} = \\frac{P \\times r \\times (1 + r)^n}{(1 + r)^n - 1}$$
  where $r = \\frac{\\text{Annual Rate}}{12 \\times 100}$ and $n = \\text{tenure in months}$.
- **Flat Rate Formula:**
  $$\\text{EMI} = \\frac{P + (P \\times \\frac{\\text{Rate}}{100} \\times \\text{Years})}{n}$$
- **Amortization Breakdown:** Each month, interest is calculated on the remaining balance: $\\text{interest} = \\text{balance} \\times r$, and $\\text{principal} = \\text{EMI} - \\text{interest}$.
`;

const emiToolTsx = `'use client';

import React, { useState } from 'react';
import { calculateLoan, formatCurrency } from '../engines/loan';

export const Tool: React.FC = () => {
  const [amount, setAmount] = useState<string>('1000000');
  const [rate, setRate] = useState<string>('9');
  const [tenureYears, setTenureYears] = useState<string>('5');
  const [currency, setCurrency] = useState<string>('INR');
  const [isFlatRate, setIsFlatRate] = useState<boolean>(false);

  const months = Math.max(1, Math.round(parseFloat(tenureYears) * 12 || 12));
  let result;
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
    const rows = result.schedule.map((s) => [s.period, s.payment, s.principal, s.interest, s.remainingBalance]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\\n');
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
        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isFlatRate}
            onChange={(e) => setIsFlatRate(e.target.checked)}
            className="rounded text-emerald-600"
          />
          <span>Flat Rate Mode (Not reducing balance)</span>
        </label>
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
              <div style={{ width: \`\${pPct}%\` }} className="bg-emerald-600 h-full" title="Principal" />
              <div style={{ width: \`\${100 - pPct}%\` }} className="bg-slate-400 dark:bg-slate-500 h-full" title="Interest" />
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
`;

writeToolContent('emi-calculator', emiSite, emiFaqs, emiExplainer);
writeToolComponent('emi-calculator', emiToolTsx);
console.log('✓ Populated emi-calculator');

// ============================================================================
// 22. WIFI QR CODE GENERATOR
// ============================================================================
const wifiSite = {
  schemaVersion: 1,
  slug: 'wifi-qr-code-generator',
  siteName: 'Wi-Fi QR Code Generator',
  toolName: 'Wi-Fi QR Code Generator',
  primaryKeyword: 'wifi qr code generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Create scannable Wi-Fi login QR codes with print-friendly cards and zero network uploads.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'slate',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const wifiFaqs = [
  {
    id: 'how-do-wifi-qr-codes-work',
    question: 'How do Wi-Fi QR codes connect devices automatically?',
    answer: 'The QR code encodes a standard ZXing Wi-Fi configuration payload (WIFI:T:...;S:...;P:...;;). When scanned with iOS Camera or Android, the device automatically parses the SSID and credentials to connect.'
  },
  {
    id: 'is-my-password-stored-or-transmitted',
    question: 'Is my network password saved or sent over the internet?',
    answer: 'Never. The QR code is generated 100% locally in your web browser. Note, however, that anyone who physically scans the code can view your network password in plain text.'
  },
  {
    id: 'escaping-special-characters',
    question: 'How are special characters in SSIDs and passwords handled?',
    answer: 'In accordance with the ZXing Wi-Fi QR specification, characters including colons, semicolons, commas, and backslashes are escaped with a preceding backslash.'
  },
  {
    id: 'print-friendly-wifi-cards',
    question: 'Can I print a guest Wi-Fi card to display?',
    answer: 'Yes. Use the "Print Guest Card" button to trigger a clean printable layout formatted specifically for tabletop or wall display.'
  },
  {
    id: 'hidden-networks-support',
    question: 'Does this work for hidden Wi-Fi networks?',
    answer: 'Yes. Enabling the "Hidden Network" checkbox appends H:true to the configuration payload so devices scan for non-broadcasting SSIDs.'
  }
];

const wifiExplainer = `
# How Wi-Fi QR Code Generator Works

The Wi-Fi QR Code Generator compiles network credentials into the standardized ZXing Wi-Fi connection format for seamless smartphone onboarding.

## ZXing Schema Protocol
The encoded payload follows the specification:
\`\`\`text
WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;
\`\`\`
- **Special Character Escaping:** Any instance of \`\\\`, \`;\`, \`,\`, \`:\`, or \`"\` is escaped with a preceding backslash.
- **Pure Client Synthesis:** Generates raster PNG and vector SVG representations using browser Canvas and vector math.
`;

const wifiToolTsx = `'use client';

import React, { useState, useEffect } from 'react';
import { generateQRCodeDataURL, generateQRCodeSVG, buildWifiPayload } from '../engines/qr';

export const Tool: React.FC = () => {
  const [ssid, setSsid] = useState<string>('Home-Network');
  const [password, setPassword] = useState<string>('SecretPassword123');
  const [authType, setAuthType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [hidden, setHidden] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [svgStr, setSvgStr] = useState<string>('');

  const payload = buildWifiPayload(ssid, password, authType, hidden);

  useEffect(() => {
    generateQRCodeDataURL(payload, { width: 320 }).then(setQrUrl).catch(console.error);
    generateQRCodeSVG(payload, { width: 320 }).then(setSvgStr).catch(console.error);
  }, [payload]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`wifi-\${ssid || 'network'}.svg\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Notice */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-400">
        <strong>Privacy Note:</strong> Generated 100% locally. The network password is contained in plain text inside the QR code for scanners to read.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Network Name (SSID)
            </label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
              placeholder="e.g. MyHomeWiFi"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Security Type
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
            >
              <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
              <option value="WEP">WEP (Legacy)</option>
              <option value="nopass">None (Open Network)</option>
            </select>
          </div>

          {authType !== 'nopass' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md font-mono"
                placeholder="Wi-Fi Password"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="rounded"
            />
            <span>Hidden Network (SSID not broadcast)</span>
          </label>
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-3">
            {qrUrl ? (
              <img src={qrUrl} alt="Wi-Fi QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">Loading...</div>
            )}
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{ssid || 'Wi-Fi Network'}</div>
          <div className="text-xs text-slate-500 mb-4">Scan with camera to connect</div>

          <div className="flex items-center gap-2">
            <a
              href={qrUrl}
              download={\`wifi-\${ssid || 'qr'}.png\`}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
            >
              Download PNG
            </a>
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Download SVG
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
            >
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

writeToolContent('wifi-qr-code-generator', wifiSite, wifiFaqs, wifiExplainer);
writeToolComponent('wifi-qr-code-generator', wifiToolTsx);
console.log('✓ Populated wifi-qr-code-generator');

// ============================================================================
// 23. WORD AND CHARACTER COUNTER
// ============================================================================
const wordSite = {
  schemaVersion: 1,
  slug: 'word-and-character-counter',
  siteName: 'Word and Character Counter',
  toolName: 'Word and Character Counter',
  primaryKeyword: 'word and character counter',
  domain: 'TODO-set-domain.com',
  tagline: 'Comprehensive text analytics with word counts, reading and speaking times, and top keyword density analysis.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'indigo',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const wordFaqs = [
  {
    id: 'how-are-reading-and-speaking-times-estimated',
    question: 'How are reading and speaking durations calculated?',
    answer: 'Silent reading speed is computed at 238 words per minute (standard collegiate benchmark), while conversational speaking time is calculated at 150 words per minute.'
  },
  {
    id: 'keyword-density-and-stop-words',
    question: 'What is keyword density and how does the stop-word filter work?',
    answer: 'Keyword density measures the percentage frequency of a word relative to total text words. Enabling the stop-word filter excludes common functional words (such as "the", "and", "is") to reveal primary topical keywords.'
  },
  {
    id: 'grapheme-cluster-character-counting',
    question: 'How are compound emojis and accented characters counted?',
    answer: 'Characters are evaluated using Intl.Segmenter grapheme clusters so that multi-codepoint emojis (like 👨‍👩‍👧‍👦) and combining accent sequences count accurately as single characters.'
  },
  {
    id: 'hyphenated-words-rule',
    question: 'Are hyphen-joined words counted as one word or two?',
    answer: 'Hyphenated words (such as "well-known") are counted as a single word token, matching standard Microsoft Word and Google Docs conventions.'
  },
  {
    id: 'performance-on-large-manuscripts',
    question: 'Can this tool handle entire novels or essays over 100,000 words?',
    answer: 'Yes. Text segmentation runs via optimized native Web APIs in linear O(n) time, analyzing large manuscripts within milliseconds without browser freezing.'
  }
];

const wordExplainer = `
# How Word and Character Counter Works

The Word and Character Counter provides deep editorial text analytics and keyword frequency metrics directly in your web browser.

## Metric Definitions
- **Word Count:** Whitespace-delimited tokens containing at least one Unicode letter (\\p{L}) or digit (\\p{N}).
- **Reading Speed:** Words divided by 238 WPM, formatted as minutes and seconds.
- **Speaking Speed:** Words divided by 150 WPM for speech drafting.
- **Keyword Density:** Frequency distribution of the top 10 substantive nouns and verbs with stop-word exclusion.
`;

const wordToolTsx = `'use client';

import React, { useState } from 'react';
import { analyzeText } from '../engines/text-stats';

export const Tool: React.FC = () => {
  const [text, setText] = useState<string>(
    'Hello, world! It\\'s a well-known fact that writing clean, concise text improves readability and user engagement.'
  );
  const [excludeStopWords, setExcludeStopWords] = useState<boolean>(true);

  const stats = analyzeText(text, { excludeStopWords });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Editor */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full p-3 font-sans text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Type or paste your text here..."
        />
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.words}</div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.charactersWithSpaces}</div>
          <div className="text-xs text-slate-500">Characters</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sentences}</div>
          <div className="text-xs text-slate-500">Sentences</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.paragraphs}</div>
          <div className="text-xs text-slate-500">Paragraphs</div>
        </div>
      </div>

      {/* Reading & Speaking Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div>
          <span className="text-slate-500 block">Reading Time (238 WPM)</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{stats.readingTimeText}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Speaking Time (150 WPM)</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{stats.speakingTimeText}</span>
        </div>
      </div>

      {/* Keyword Density */}
      {stats.topKeywords.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Top Keywords & Density</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
              <input
                type="checkbox"
                checked={excludeStopWords}
                onChange={(e) => setExcludeStopWords(e.target.checked)}
                className="rounded"
              />
              <span>Filter Stop Words</span>
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.topKeywords.map((kw, idx) => (
              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-medium text-slate-900 dark:text-white truncate">{kw.word}</div>
                <div className="text-[11px] text-slate-500">
                  {kw.count}x ({kw.density}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
`;

writeToolContent('word-and-character-counter', wordSite, wordFaqs, wordExplainer);
writeToolComponent('word-and-character-counter', wordToolTsx);
console.log('✓ Populated word-and-character-counter');

