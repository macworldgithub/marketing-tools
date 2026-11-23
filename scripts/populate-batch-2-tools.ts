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
  fs.writeFileSync(path.join(dir, 'site.json'), JSON.stringify(siteJson, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'faqs.json'), JSON.stringify({ schemaVersion: 1, items: faqs }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'explainer.md'), explainerMd.trim(), 'utf-8');
}

function writeToolComponent(slug: string, tsxCode: string) {
  const dir = path.join(ROOT_DIR, slug, 'src', 'tool');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const file = path.join(dir, 'index.tsx');
  fs.writeFileSync(file, tsxCode.trim(), 'utf-8');
}

// ============================================================================
// 11. BASE64 ENCODER & DECODER
// ============================================================================
const base64Site = {
  schemaVersion: 1,
  slug: 'base64-encoder',
  siteName: 'Base64 Encoder',
  toolName: 'Base64 Encoder & Decoder',
  primaryKeyword: 'base64 encoder',
  domain: 'TODO-set-domain.com',
  tagline: 'Encode and decode UTF-8 text, binary files, and URL-safe data strings completely in your browser.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'blue',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const base64Faqs = [
  {
    id: 'how-does-utf8-base64-work',
    question: 'Why is UTF-8 safe encoding important for Base64?',
    answer: 'Standard browser btoa() throws an exception on Unicode characters (such as emojis, accents, and non-Latin alphabets). Our tool uses TextEncoder and TextDecoder to ensure all Unicode characters are properly preserved without corruption.'
  },
  {
    id: 'what-is-url-safe-base64',
    question: 'What is URL-safe Base64 encoding?',
    answer: 'Standard Base64 uses "+" and "/" which have reserved meanings in URL parameters. URL-safe Base64 replaces "+" with "-" and "/" with "_", and omits trailing "=" padding characters.'
  },
  {
    id: 'are-files-uploaded-to-server',
    question: 'Are my files uploaded to a remote server when encoding?',
    answer: 'Never. File reading and binary conversion occur entirely in your local browser memory using the FileReader and TypedArray APIs. Zero network requests are made.'
  },
  {
    id: 'what-is-mime-line-wrapping',
    question: 'What does the 76-character MIME wrap option do?',
    answer: 'The MIME standard (RFC 2045) specifies that Base64 email attachments and headers should be split into lines of at most 76 characters separated by CRLF line breaks.'
  },
  {
    id: 'how-to-decode-malformed-base64',
    question: 'How does the decoder handle missing padding or URL-safe characters?',
    answer: 'Our decoder automatically normalizes URL-safe characters and restores missing "=" padding before decoding, reporting clear syntax errors if invalid characters are detected.'
  }
];

const base64Explainer = `
# How Base64 Encoding and Decoding Works

Base64 is a binary-to-text encoding scheme that translates arbitrary binary sequences into a set of 64 ASCII characters (\`A-Z\`, \`a-z\`, \`0-9\`, \`+\`, and \`/\`).

## RFC 4648 Compliance
Each group of three 8-bit input bytes (24 bits total) is split into four 6-bit integers, each mapped to a character in the Base64 alphabet. When the input length is not divisible by 3, padding with \`=\` characters ensures full alignment.

## UTF-8 Safe Architecture
Standard JavaScript implementations that call \`btoa\` directly fail on multi-byte Unicode strings. This tool runs a chunked binary buffer through \`TextEncoder\` and \`TextDecoder\`, supporting emojis, mathematical symbols, and all international alphabets safely.

## Key Features
- **URL-Safe Encoding:** Converts \`+\` to \`-\`, \`/\` to \`_\`, and strips padding for query strings.
- **MIME Line Wrap:** Inserts CRLF breaks every 76 characters for SMTP and email interoperability.
- **File to Base64:** Encodes images, audio, or documents with optional Data URI headers.
`;

const base64ToolTsx = `'use client';

import React, { useState } from 'react';
import { encodeBase64, decodeBase64, bytesToBase64 } from '../engines/base64';

export const Tool: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState<string>('Hello, World!');
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [lineWrap, setLineWrap] = useState<boolean>(false);
  const [dataUri, setDataUri] = useState<boolean>(false);
  const [mimeType, setMimeType] = useState<string>('text/plain');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  let output = '';
  try {
    if (mode === 'encode') {
      const encoded = encodeBase64(input, { urlSafe, lineWrap: lineWrap ? 76 : 0 });
      output = dataUri ? \`data:\${mimeType};base64,\${encoded}\` : encoded;
    } else {
      let toDecode = input.trim();
      if (toDecode.startsWith('data:')) {
        const commaIdx = toDecode.indexOf(',');
        if (commaIdx !== -1) toDecode = toDecode.slice(commaIdx + 1);
      }
      output = decodeBase64(toDecode);
    }
    if (error) setError(null);
  } catch (err: any) {
    output = '';
    if (!error) setError(err.message || 'Invalid Base64 sequence');
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      const b64 = bytesToBase64(bytes, { urlSafe, lineWrap: lineWrap ? 76 : 0 });
      setInput(b64);
      setMode('decode');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'encoded.b64.txt' : 'decoded.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Mode Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setMode('encode'); setError(null); }}
          className={\`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors \${
            mode === 'encode'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }\`}
        >
          Encode to Base64
        </button>
        <button
          onClick={() => { setMode('decode'); setError(null); }}
          className={\`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors \${
            mode === 'decode'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }\`}
        >
          Decode from Base64
        </button>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
        {mode === 'encode' && (
          <>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} className="rounded" />
              <span>URL-Safe (- and _)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={lineWrap} onChange={(e) => setLineWrap(e.target.checked)} className="rounded" />
              <span>MIME Wrap (76 chars)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={dataUri} onChange={(e) => setDataUri(e.target.checked)} className="rounded" />
              <span>Data URI Prefix</span>
            </label>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="cursor-pointer px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-700">
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => { setInput(''); setError(null); }}
            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Input */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{mode === 'encode' ? 'Plain Text / Input' : 'Base64 Input'}</span>
          <span>{input.length} chars</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste Base64 string to decode...'}
          rows={5}
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400">
          <strong>Decoding Error:</strong> {error}
        </div>
      )}

      {/* Output */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{mode === 'encode' ? 'Base64 Result' : 'Decoded Text'}</span>
          <span>{output.length} chars</span>
        </div>
        <textarea
          value={output}
          readOnly
          rows={5}
          placeholder="Result will appear here..."
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          disabled={!output}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
        >
          {copied ? 'Copied to Clipboard!' : 'Copy Result'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!output}
          className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Download
        </button>
      </div>
    </div>
  );
};
`;

writeToolContent('base64-encoder', base64Site, base64Faqs, base64Explainer);
writeToolComponent('base64-encoder', base64ToolTsx);
console.log('✓ Populated base64-encoder');

// ============================================================================
// 12. FAKE NAME GENERATOR
// ============================================================================
const fakeNameSite = {
  schemaVersion: 1,
  slug: 'fake-name-generator',
  siteName: 'Fake Name Generator',
  toolName: 'Fake Name Generator',
  primaryKeyword: 'fake name generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate realistic placeholder identities with safe fictional emails and phone numbers for testing and mockups.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'teal',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const fakeNameFaqs = [
  {
    id: 'is-generated-data-real',
    question: 'Are these names and contact details connected to real individuals?',
    answer: 'No. All generated identities are completely fictional combinations from bundled linguistic name datasets. Any resemblance to real living or deceased persons is purely coincidental.'
  },
  {
    id: 'safe-phone-and-email-guarantees',
    question: 'Why are emails and phone numbers guaranteed safe for development?',
    answer: 'Emails are exclusively created using RFC 2606 reserved domains (example.com, example.org, example.net) which can never receive spam. US phone numbers use the fictional 555-0100 to 555-0199 test range.'
  },
  {
    id: 'government-ids-policy',
    question: 'Does this tool generate Social Security numbers, credit cards, or passports?',
    answer: 'Strictly no. To prevent misuse, this utility never generates government identification numbers, financial credentials, or private citizen records.'
  },
  {
    id: 'export-formats',
    question: 'How can I export generated names for database seeding?',
    answer: 'You can instantly copy data to your clipboard or download clean CSV and structured JSON files compatible with mock APIs and database seeding scripts.'
  },
  {
    id: 'reproducible-seed-generation',
    question: 'Can I generate the same set of test users across multiple runs?',
    answer: 'Yes. By entering an optional numeric Seed value, the deterministic pseudorandom number generator produces the exact same sequence of names across test sessions.'
  }
];

const fakeNameExplainer = `
# How Fake Name Generator Works

The Fake Name Generator generates realistic, culturally authentic mock identities for software QA testing, user interface prototyping, and database seeding.

## Bundled Datasets & Locales
The tool includes built-in name dictionaries across 6 major regions: United States, United Kingdom, India, Pakistan, Canada, and Australia. Each locale contains curated first names and surnames matching regional naming patterns.

## Safe-By-Design Principles
1. **Reserved Domains:** All generated email addresses resolve strictly to \`example.com\`, \`example.org\`, or \`example.net\`.
2. **Fictional Telephony:** US phone numbers are pinned to the \`555-0100\` through \`555-0199\` block designated by telecom regulators for fictional use.
3. **No PII or Government IDs:** No SSNs, tax numbers, credit cards, or national identity identifiers are ever produced.
`;

const fakeNameToolTsx = `'use client';

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
    a.download = \`fake-identities-\${locale.toLowerCase()}-\${people.length}.csv\`;
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
`;

writeToolContent('fake-name-generator', fakeNameSite, fakeNameFaqs, fakeNameExplainer);
writeToolComponent('fake-name-generator', fakeNameToolTsx);
console.log('✓ Populated fake-name-generator');

// ============================================================================
// 13. IMAGE COMPRESSOR
// ============================================================================
const imgCompSite = {
  schemaVersion: 1,
  slug: 'image-compressor',
  siteName: 'Image Compressor',
  toolName: 'Image Compressor',
  primaryKeyword: 'image compressor',
  domain: 'TODO-set-domain.com',
  tagline: 'Compress JPEG, PNG, and WebP images client-side with instant before and after size comparison.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'emerald',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const imgCompFaqs = [
  {
    id: 'how-does-client-side-compression-work',
    question: 'How does client-side image compression work without server uploads?',
    answer: 'Images are drawn to an HTML5 Canvas using createImageBitmap and re-encoded directly in browser memory at your designated quality setting. Zero bytes are uploaded to any server.'
  },
  {
    id: 'why-are-exif-metadata-stripped',
    question: 'Are EXIF metadata and GPS locations stripped during compression?',
    answer: 'Yes. Drawing an image to a canvas naturally strips all EXIF metadata, camera settings, and geolocation tags, enhancing privacy while reducing file weight.'
  },
  {
    id: 'what-happens-if-compressed-file-is-larger',
    question: 'What happens if the compressed result is larger than the original?',
    answer: 'If re-encoding does not yield a smaller file size (common when attempting to re-compress already heavily optimized files), the tool automatically preserves your original file and alerts you.'
  },
  {
    id: 'which-formats-supported',
    question: 'Which image formats are supported for compression?',
    answer: 'JPEG, WebP, and PNG images are supported. You can re-encode JPEGs and WebPs with custom quality factors or convert PNGs to modern WebP.'
  },
  {
    id: 'batch-compression-support',
    question: 'Can I compress multiple images at once?',
    answer: 'Yes. You can drag and drop multiple files to compress them simultaneously and download them individually or as a ZIP archive.'
  }
];

const imgCompExplainer = `
# How Image Compressor Works

The Image Compressor optimizes image payload sizes locally within your browser using HTML5 Canvas rendering and browser-native image encoders.

## Lossy vs Lossless Compression
- **JPEG / WebP Optimization:** Uses discrete cosine transform (DCT) and predictive block compression with an adjustable quality factor (0.1 to 1.0, default 0.75).
- **Dimension Clamping:** Optional maximum dimension constraints downscale oversized photos to prevent wasted bandwidth.
- **Strict Size Guard:** If a compressed output does not reduce file size, the original image is retained unchanged.
- **Privacy Protection:** All EXIF metadata, camera serial numbers, and GPS geotags are stripped during processing.
`;

const imgCompToolTsx = `'use client';

import React, { useState } from 'react';
import { formatFileSize, calculateCompressionSaved } from '../engines/image-io';

interface CompressedItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  savedPct: number;
  dataUrl: string;
}

export const Tool: React.FC = () => {
  const [quality, setQuality] = useState<number>(0.75);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [maxDimension, setMaxDimension] = useState<number>(2048);
  const [items, setItems] = useState<CompressedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const processFile = (file: File): Promise<CompressedItem> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unsupported'));
          return;
        }

        // Fill white background for JPEGs
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const isSmaller = blob.size < file.size;
            const finalBlob = isSmaller ? blob : file;
            const finalSize = finalBlob.size;
            const savedPct = calculateCompressionSaved(file.size, finalSize);

            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: Math.random().toString(36).slice(2),
                name: file.name,
                originalSize: file.size,
                compressedSize: finalSize,
                savedPct,
                dataUrl: reader.result as string,
              });
            };
            reader.readAsDataURL(finalBlob);
          },
          format,
          quality
        );
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      const results: CompressedItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await processFile(files[i]);
        results.push(item);
      }
      setItems((prev) => [...results, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Notice */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-xs text-emerald-800 dark:text-emerald-300">
        100% Client-Side. Images are never uploaded to a server. Metadata (EXIF/GPS) is stripped automatically.
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Quality ({Math.round(quality * 100)}%)
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="image/jpeg">JPEG (.jpg)</option>
            <option value="image/webp">WebP (.webp)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Dimension (px)</label>
          <input
            type="number"
            value={maxDimension}
            onChange={(e) => setMaxDimension(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {isProcessing ? 'Compressing images...' : 'Click to select or drag images here'}
        </span>
        <span className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP supported</span>
        <input type="file" multiple accept="image/*" onChange={handleFiles} disabled={isProcessing} className="hidden" />
      </label>

      {/* Compressed Items List */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Processed Images ({items.length})</span>
            <button onClick={() => setItems([])} className="hover:text-slate-800 dark:hover:text-slate-200">
              Clear All
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {items.map((it) => (
              <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 truncate pr-4">
                  <img src={it.dataUrl} alt={it.name} className="w-10 h-10 object-cover rounded bg-slate-100" />
                  <div className="truncate">
                    <div className="font-medium text-slate-900 dark:text-white truncate">{it.name}</div>
                    <div className="text-slate-500">
                      {formatFileSize(it.originalSize)} → {formatFileSize(it.compressedSize)}
                      {it.savedPct > 0 ? (
                        <span className="ml-2 text-emerald-600 font-semibold">(-{it.savedPct}%)</span>
                      ) : (
                        <span className="ml-2 text-slate-400">(Original preserved)</span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={it.dataUrl}
                  download={\`compressed-\${it.name.replace(/\\.[^.]+$/, '')}.\${format === 'image/jpeg' ? 'jpg' : 'webp'}\`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold whitespace-nowrap"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
`;

writeToolContent('image-compressor', imgCompSite, imgCompFaqs, imgCompExplainer);
writeToolComponent('image-compressor', imgCompToolTsx);
console.log('✓ Populated image-compressor');

// ============================================================================
// 14. IMAGE TO PDF
// ============================================================================
const imgPdfSite = {
  schemaVersion: 1,
  slug: 'image-to-pdf',
  siteName: 'Image to PDF Converter',
  toolName: 'Image to PDF Converter',
  primaryKeyword: 'image to pdf',
  domain: 'TODO-set-domain.com',
  tagline: 'Combine and convert multiple images into a clean PDF document with custom margins and page sizes.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'indigo',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const imgPdfFaqs = [
  {
    id: 'how-are-images-compiled-into-pdf',
    question: 'How are images converted into PDF without a backend?',
    answer: 'This tool uses the pdf-lib library running natively in your browser. Each uploaded image is scaled and embedded onto document pages according to your layout preferences.'
  },
  {
    id: 'supported-page-sizes',
    question: 'What page sizes and orientations can I choose?',
    answer: 'Standard A4 (595.28 x 841.89 pt), US Letter (612 x 792 pt), and Fit-to-Image modes are supported in Portrait, Landscape, or Auto orientation.'
  },
  {
    id: 'can-i-reorder-images',
    question: 'Can I change the order of pages before downloading?',
    answer: 'Yes. You can use the Move Up and Move Down controls on each image to arrange pages exactly as desired.'
  },
  {
    id: 'margin-and-fit-options',
    question: 'What margin and image scaling options are available?',
    answer: 'You can choose between zero margin, 18 pt (small), or 36 pt (standard), with options to Contain (preserve aspect ratio), Cover, or Stretch images across the page.'
  },
  {
    id: 'is-my-document-private',
    question: 'Is my document private and secure?',
    answer: 'Completely private. No image bytes or generated PDF documents ever leave your device or travel over the network.'
  }
];

const imgPdfExplainer = `
# How Image to PDF Converter Works

The Image to PDF Converter compiles multiple raster images into a single standardized PDF document entirely within your browser using \`pdf-lib\`.

## Geometric Placement & Alignment
- **A4 & Letter Standards:** Uses exact typographic point dimensions (72 pt per inch). A4 corresponds to 595.28 × 841.89 pt; Letter to 612 × 792 pt.
- **Aspect Scaling (Contain):** Calculates the maximal scaling factor \`scale = min(availW / imgW, availH / imgH)\` and centers the image symmetrically with equalized margins.
- **Multi-Image Sequencing:** Allows reordering pages seamlessly prior to compiling the final binary document.
`;

const imgPdfToolTsx = `'use client';

import React, { useState } from 'react';
import { imagesToPDF, PageSizeOption, PageOrientation, PageFit, PDFImageInput } from '../engines/pdf';

interface ImageEntry {
  id: string;
  name: string;
  width: number;
  height: number;
  bytes: Uint8Array;
  format: 'jpeg' | 'png';
  previewUrl: string;
}

export const Tool: React.FC = () => {
  const [pageSize, setPageSize] = useState<PageSizeOption>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [marginPt, setMarginPt] = useState<number>(36);
  const [fit, setFit] = useState<PageFit>('contain');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuf = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuf);
        const img = new Image();
        const previewUrl = URL.createObjectURL(file);
        img.onload = () => {
          const format: 'jpeg' | 'png' = file.type === 'image/jpeg' ? 'jpeg' : 'png';
          setImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              name: file.name,
              width: img.width,
              height: img.height,
              bytes,
              format,
              previewUrl,
            },
          ]);
        };
        img.src = previewUrl;
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const moveDown = (idx: number) => {
    setImages((prev) => {
      if (idx >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
      const inputs: PDFImageInput[] = images.map((img) => ({
        bytes: img.bytes,
        width: img.width,
        height: img.height,
        format: img.format,
      }));

      const pdfBytes = await imagesToPDF(inputs, { pageSize, orientation, marginPt, fit });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Settings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Page Size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="Letter">US Letter</option>
            <option value="FitToImage">Fit to Image</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Orientation</label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as PageOrientation)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
            <option value="auto">Auto (Match Image)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Margin</label>
          <select
            value={marginPt}
            onChange={(e) => setMarginPt(parseInt(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value={0}>No Margin (0 pt)</option>
            <option value={18}>Narrow (18 pt)</option>
            <option value={36}>Standard (36 pt)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Image Fit</label>
          <select
            value={fit}
            onChange={(e) => setFit(e.target.value as PageFit)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="contain">Contain (Keep Ratio)</option>
            <option value="cover">Cover (Fill Page)</option>
            <option value="stretch">Stretch to Fit</option>
          </select>
        </div>
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Click or drag images to add pages
        </span>
        <span className="text-xs text-slate-500 mt-1">PNG and JPEG supported</span>
        <input type="file" multiple accept="image/png,image/jpeg" onChange={handleFiles} className="hidden" />
      </label>

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Pages ({images.length})</span>
            <button onClick={() => setImages([])} className="hover:text-slate-800 dark:hover:text-slate-200">
              Clear All
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {images.map((img, idx) => (
              <div key={img.id} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 truncate pr-4">
                  <span className="font-semibold text-slate-400 w-4">{idx + 1}</span>
                  <img src={img.previewUrl} alt={img.name} className="w-8 h-8 object-cover rounded bg-slate-100" />
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">{img.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="px-2 py-1 text-slate-600 disabled:opacity-30">
                    ▲
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === images.length - 1} className="px-2 py-1 text-slate-600 disabled:opacity-30">
                    ▼
                  </button>
                  <button onClick={() => removeImage(img.id)} className="px-2 py-1 text-red-600">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleGeneratePdf}
        disabled={images.length === 0 || isGenerating}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {isGenerating ? 'Building PDF Document...' : \`Generate PDF (\${images.length} Pages)\`}
      </button>
    </div>
  );
};
`;

writeToolContent('image-to-pdf', imgPdfSite, imgPdfFaqs, imgPdfExplainer);
writeToolComponent('image-to-pdf', imgPdfToolTsx);
console.log('✓ Populated image-to-pdf');

// ============================================================================
// 15. JPG TO PNG
// ============================================================================
const jpgPngSite = {
  schemaVersion: 1,
  slug: 'jpg-to-png',
  siteName: 'JPG to PNG Converter',
  toolName: 'JPG to PNG Converter',
  primaryKeyword: 'jpg to png',
  domain: 'TODO-set-domain.com',
  tagline: 'Losslessly convert JPG images to PNG format directly in your browser with zero server uploads.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'blue',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const jpgPngFaqs = [
  {
    id: 'does-converting-jpg-to-png-improve-quality',
    question: 'Does converting JPG to PNG improve image quality?',
    answer: 'No. While PNG is a lossless format, converting an existing JPG cannot restore compression artifacts or visual details that JPEG lossy compression already discarded.'
  },
  {
    id: 'why-are-png-files-larger',
    question: 'Why are converted PNG files often larger than the original JPG?',
    answer: 'PNG uses lossless DEFLATE compression which preserves exact pixel color values, whereas JPEG uses lossy discrete cosine transform. Consequently, converted PNG files are almost always larger.'
  },
  {
    id: 'batch-conversion-and-zip',
    question: 'Can I convert multiple JPGs and download them as a ZIP archive?',
    answer: 'Yes. You can select multiple images to convert them in batch, downloading them individually or bundled together in a ZIP file.'
  },
  {
    id: 'privacy-guarantee',
    question: 'Are my images uploaded to any remote server?',
    answer: 'No. The conversion is performed locally via your browser HTML5 Canvas. No image data is ever uploaded or transmitted.'
  },
  {
    id: 'supported-input-formats',
    question: 'Can I convert other formats to PNG?',
    answer: 'Yes. The converter accepts JPG, JPEG, WebP, and BMP files and converts them all into standard lossless PNG.'
  }
];

const jpgPngExplainer = `
# How JPG to PNG Converter Works

The JPG to PNG Converter decodes JPEG and WebP raster images locally and re-encodes them into the lossless Portable Network Graphics (PNG) format using the HTML5 Canvas API.

## Technical Honesty & Trade-offs
- **Lossless Container:** PNG preserves exact pixel colors without introducing further compression artifacts.
- **Original Quality Limits:** Converting does not restore high-frequency detail or color data discarded during initial JPEG compression.
- **File Size Increase:** Because PNG is lossless, resulting files are typically larger than their JPEG counterparts.
`;

const jpgPngToolTsx = `'use client';

import React, { useState } from 'react';
import { formatFileSize } from '../engines/image-io';
import { zipSync } from 'fflate';

interface ConvertedPng {
  id: string;
  name: string;
  origSize: number;
  pngSize: number;
  dataUrl: string;
  pngBytes: Uint8Array;
}

export const Tool: React.FC = () => {
  const [items, setItems] = useState<ConvertedPng[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const convertFile = (file: File): Promise<ConvertedPng> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unsupported'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Conversion failed'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const arrayBuf = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuf);
            resolve({
              id: Math.random().toString(36).slice(2),
              name: file.name.replace(/\\.[^.]+$/, '') + '.png',
              origSize: file.size,
              pngSize: blob.size,
              dataUrl: canvas.toDataURL('image/png'),
              pngBytes: bytes,
            });
          };
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const results: ConvertedPng[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await convertFile(files[i]);
        results.push(item);
      }
      setItems((prev) => [...results, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = () => {
    if (items.length === 0) return;
    const zipData: Record<string, Uint8Array> = {};
    for (const it of items) {
      zipData[it.name] = it.pngBytes;
    }
    const zipped = zipSync(zipData);
    const blob = new Blob([zipped], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-png-images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md text-xs text-blue-800 dark:text-blue-300">
        <strong>Quality Note:</strong> Converting JPG to PNG will not restore quality previously discarded by JPEG lossy compression, and PNG files are typically larger.
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {isProcessing ? 'Converting to PNG...' : 'Click or drag JPG/JPEG images here'}
        </span>
        <span className="text-xs text-slate-500 mt-1">Batch conversion supported with ZIP download</span>
        <input type="file" multiple accept="image/jpeg,image/jpg,image/webp" onChange={handleFiles} disabled={isProcessing} className="hidden" />
      </label>

      {/* Converted items */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Converted Images ({items.length})</span>
            <div className="flex items-center gap-2">
              {items.length > 1 && (
                <button onClick={handleDownloadAllZip} className="font-semibold text-blue-600 hover:underline">
                  Download All (ZIP)
                </button>
              )}
              <button onClick={() => setItems([])} className="hover:text-slate-800 dark:hover:text-slate-200">
                Clear
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {items.map((it) => (
              <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 truncate pr-4">
                  <img src={it.dataUrl} alt={it.name} className="w-10 h-10 object-cover rounded bg-slate-100" />
                  <div className="truncate">
                    <div className="font-medium text-slate-900 dark:text-white truncate">{it.name}</div>
                    <div className="text-slate-500">
                      JPG: {formatFileSize(it.origSize)} → PNG: {formatFileSize(it.pngSize)}
                    </div>
                  </div>
                </div>
                <a
                  href={it.dataUrl}
                  download={it.name}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold whitespace-nowrap"
                >
                  Download PNG
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
`;

writeToolContent('jpg-to-png', jpgPngSite, jpgPngFaqs, jpgPngExplainer);
writeToolComponent('jpg-to-png', jpgPngToolTsx);
console.log('✓ Populated jpg-to-png');

// ============================================================================
// 16. JSON FORMATTER
// ============================================================================
const jsonSite = {
  schemaVersion: 1,
  slug: 'json-formatter',
  siteName: 'JSON Formatter',
  toolName: 'JSON Formatter & Validator',
  primaryKeyword: 'json formatter',
  domain: 'TODO-set-domain.com',
  tagline: 'Prettify, validate, sort keys, and repair malformed JSON with 64-bit integer preservation in your browser.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'teal',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const jsonFaqs = [
  {
    id: 'how-are-bigints-preserved',
    question: 'How does this tool prevent large numbers and decimals from losing precision?',
    answer: 'Standard JSON.parse in JavaScript rounds numbers exceeding 53 bits (Number.MAX_SAFE_INTEGER). Our tool uses lossless-json to preserve 64-bit integer strings and decimal accuracy exactly.'
  },
  {
    id: 'how-does-json-repair-work',
    question: 'What does the "Try to Repair" action fix?',
    answer: 'The repair tool resolves common syntax oversights including trailing commas, single-quoted strings, unquoted object keys, and unescaped characters using jsonrepair.'
  },
  {
    id: 'error-line-and-column-reporting',
    question: 'How are syntax error locations reported?',
    answer: 'When validation detects a syntax error, the tool calculates the 1-based line and column coordinates so you can jump directly to the invalid character.'
  },
  {
    id: 'key-sorting-mechanism',
    question: 'Does key sorting apply to nested objects?',
    answer: 'Yes. Enabling key sorting recursively orders all object keys alphabetically across all nested levels while leaving arrays in their original order.'
  },
  {
    id: 'is-my-json-data-private',
    question: 'Is my data transmitted or stored anywhere?',
    answer: 'Never. All parsing, validation, formatting, and repair algorithms execute 100% locally in your client environment.'
  }
];

const jsonExplainer = `
# How JSON Formatter & Validator Works

The JSON Formatter validates, indents, minifies, and repairs JavaScript Object Notation data completely within the client browser.

## Lossless Precision Guarantee
Standard browser JSON parsers convert all numeric literals to IEEE 754 64-bit floating point numbers, silently corrupting IDs that exceed $2^{53} - 1$ (e.g. \`12345678901234567890\`). Using \`lossless-json\`, every numeric string is preserved in its original textual representation without floating-point degradation.

## Error Pinpointing & Repair
- **1-Based Coordinates:** pinpoints errors with exact line and column indices (e.g. trailing comma at Line 1, Column 8).
- **Safe JSON Repair:** Cleans common human syntax errors such as JavaScript single quotes or misplaced commas on request.
`;

const jsonToolTsx = `'use client';

import React, { useState } from 'react';
import { formatJSON, validateJSON, repairJSON, IndentOption } from '../engines/json';

export const Tool: React.FC = () => {
  const [input, setInput] = useState<string>('{\\n  "b": 1,\\n  "a": [1, 2, {"c": null}]\\n}');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorPos, setErrorPos] = useState<{ line: number; column: number } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFormat = () => {
    try {
      const formatted = formatJSON(input, { indent, sortKeys, minify: false });
      setInput(formatted);
      setErrorMsg(null);
      setErrorPos(null);
    } catch (err: any) {
      const v = validateJSON(input);
      if (v.error) {
        setErrorMsg(v.error.message);
        setErrorPos({ line: v.error.line, column: v.error.column });
      } else {
        setErrorMsg(err.message || 'Formatting failed');
      }
    }
  };

  const handleMinify = () => {
    try {
      const minified = formatJSON(input, { sortKeys, minify: true });
      setInput(minified);
      setErrorMsg(null);
      setErrorPos(null);
    } catch (err: any) {
      const v = validateJSON(input);
      if (v.error) {
        setErrorMsg(v.error.message);
        setErrorPos({ line: v.error.line, column: v.error.column });
      }
    }
  };

  const handleRepair = () => {
    try {
      const res = repairJSON(input);
      setInput(res.repairedText);
      setErrorMsg(null);
      setErrorPos(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Repair failed');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[780px] mx-auto shadow-sm space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400">Indent:</span>
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value as IndentOption)}
              className="px-2 py-1 bg-white dark:bg-slate-800 border rounded"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="rounded" />
            <span>Sort Keys</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRepair}
            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded font-medium hover:bg-amber-100"
          >
            Try to Repair
          </button>
          <button
            onClick={handleMinify}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100"
          >
            Minify
          </button>
          <button
            onClick={handleFormat}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold"
          >
            Format JSON
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400">
          <strong>Syntax Error:</strong> {errorMsg}
          {errorPos && <span className="ml-2 font-mono">(Line {errorPos.line}, Column {errorPos.column})</span>}
        </div>
      )}

      {/* Editor */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={14}
        className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        placeholder="Paste JSON here..."
      />

      {/* Bottom actions */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{input.length} characters</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50"
          >
            Download .json
          </button>
        </div>
      </div>
    </div>
  );
};
`;

writeToolContent('json-formatter', jsonSite, jsonFaqs, jsonExplainer);
writeToolComponent('json-formatter', jsonToolTsx);
console.log('✓ Populated json-formatter');

// ============================================================================
// 17. LOREM IPSUM GENERATOR
// ============================================================================
const loremSite = {
  schemaVersion: 1,
  slug: 'lorem-ipsum-generator',
  siteName: 'Lorem Ipsum Generator',
  toolName: 'Lorem Ipsum Generator',
  primaryKeyword: 'lorem ipsum generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate exact word counts, sentences, or paragraphs of classic Latin dummy text in plain text or HTML.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'slate',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const loremFaqs = [
  {
    id: 'what-is-lorem-ipsum',
    question: 'What is Lorem Ipsum placeholder text?',
    answer: 'Lorem Ipsum is standard dummy text used by the printing and typesetting industry since the 1500s. Derived from Cicero\'s philosophical treatise De Finibus Bonorum et Malorum, it mimics natural typographic word distributions.'
  },
  {
    id: 'exact-word-count-guarantee',
    question: 'Does requesting N words produce exactly N words?',
    answer: 'Yes. Our generator engine strictly guarantees that selecting any word count from 1 to 500 will output exactly that count of whitespace-separated words.'
  },
  {
    id: 'can-i-toggle-the-classic-opening',
    question: 'Can I disable the standard "Lorem ipsum dolor sit amet" beginning?',
    answer: 'Yes. A dedicated toggle switch allows you to start immediately with randomized Latin words rather than the classic opening phrase.'
  },
  {
    id: 'html-paragraph-tags',
    question: 'Can I export dummy text pre-wrapped in HTML paragraph tags?',
    answer: 'Yes. Selecting the HTML output option wraps every generated block in <p>...</p> tags ready for direct insertion into web templates.'
  },
  {
    id: 'sentence-punctuation-rules',
    question: 'How are sentences and commas structured in the text?',
    answer: 'Sentences range realistically between 5 and 15 words, with comma pauses inserted in clauses exceeding 8 words, capital initial letters, and terminating periods.'
  }
];

const loremExplainer = `
# How Lorem Ipsum Generator Works

The Lorem Ipsum Generator produces authentic Latin dummy text tailored for layout prototyping and typography testing.

## Algorithmic Precision
- **Exact Word Counting:** When generating by word count, the engine produces exactly the requested number of tokens without overshooting or clipping mid-word.
- **Natural Cadence:** Sentences vary between 5 and 15 words with inserted mid-clause punctuation, simulating natural linguistic paragraph flow.
- **Format Flexibility:** Outputs directly to plain text or clean semantic \`<p>\` HTML tags.
`;

const loremToolTsx = `'use client';

import React, { useState } from 'react';
import { generateLorem } from '../engines/lorem';

export const Tool: React.FC = () => {
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [asHtml, setAsHtml] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const output = generateLorem({ type, count, startWithLorem, asHtml });

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Generate By</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Count ({type === 'words' ? '1–500' : '1–50'})
          </label>
          <input
            type="number"
            min={1}
            max={type === 'words' ? 500 : 50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(type === 'words' ? 500 : 50, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
          />
        </div>
        <div className="flex flex-col justify-end space-y-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={startWithLorem} onChange={(e) => setStartWithLorem(e.target.checked)} className="rounded" />
            <span>Start with "Lorem ipsum..."</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={asHtml} onChange={(e) => setAsHtml(e.target.checked)} className="rounded" />
            <span>Wrap in &lt;p&gt; tags</span>
          </label>
        </div>
      </div>

      {/* Output */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>Generated Text</span>
          <span>{output.split(/\\s+/).filter(Boolean).length} words</span>
        </div>
        <textarea
          value={output}
          readOnly
          rows={10}
          className="w-full p-3 font-serif text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {copied ? 'Copied to Clipboard!' : 'Copy Lorem Ipsum'}
      </button>
    </div>
  );
};
`;

writeToolContent('lorem-ipsum-generator', loremSite, loremFaqs, loremExplainer);
writeToolComponent('lorem-ipsum-generator', loremToolTsx);
console.log('✓ Populated lorem-ipsum-generator');

// ============================================================================
// 18. STRONG PASSWORD GENERATOR
// ============================================================================
const strongPassSite = {
  schemaVersion: 1,
  slug: 'strong-password-generator',
  siteName: 'Strong Password Generator',
  toolName: 'Strong Password Generator',
  primaryKeyword: 'strong password generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate high-entropy random passwords and multi-word passphrases with client-side CSPRNG randomness.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'indigo',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const strongPassFaqs = [
  {
    id: 'how-is-password-entropy-calculated',
    question: 'How is password entropy measured?',
    answer: 'Entropy is calculated as Length × log2(Pool Size). A 20-character password spanning all 94 ASCII characters provides over 131 bits of generation entropy, rendering brute-force attacks mathematically impossible.'
  },
  {
    id: 'passphrase-vs-random-password',
    question: 'Why choose a multi-word passphrase over random characters?',
    answer: 'Passphrases combine high entropy with human memorability. A 5-word passphrase drawn from a standard dictionary offers over 64 bits of entropy while remaining easy to type without transcription errors.'
  },
  {
    id: 'cryptographic-randomness-guarantee',
    question: 'How is cryptographically secure randomness guaranteed?',
    answer: 'Randomness is sourced exclusively from the browser crypto.getRandomValues API with rejection sampling to eliminate modulo bias. Math.random is strictly forbidden.'
  },
  {
    id: 'are-passwords-stored-or-logged',
    question: 'Are generated passwords saved or logged in any way?',
    answer: 'Never. Passwords exist only in active browser memory and disappear when the page is refreshed. Nothing is ever sent to a server.'
  },
  {
    id: 'ambiguous-character-exclusion',
    question: 'What does the ambiguous character exclusion option do?',
    answer: 'Excluding ambiguous characters removes visually confusing glyphs such as uppercase I, lowercase l, numeral 1, uppercase O, and numeral 0 to prevent transcription mistakes.'
  }
];

const strongPassExplainer = `
# How Strong Password Generator Works

The Strong Password Generator synthesizes high-entropy credentials locally using the browser Cryptographically Secure Pseudorandom Number Generator (\`crypto.getRandomValues\`).

## Entropy & Security Strength
- **Information Entropy:** Entropy is defined as $\\text{bits} = L \\times \\log_2(N)$ where $L$ is credential length and $N$ is pool size.
- **Classification:** Weak (<40 bits), Fair (40–59 bits), Good (60–79 bits), Strong (80–99 bits), Very Strong (≥100 bits).
- **Zero Modulo Bias:** Employs rejection sampling so that every candidate character in the selected character sets has an equal mathematical probability.
`;

const strongPassToolTsx = `'use client';

import React, { useState } from 'react';
import {
  generatePassword,
  generatePassphrase,
  calculateEntropy,
  getStrengthLabel,
  GeneratedPassword,
} from '../engines/password';

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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  let passwords: GeneratedPassword[] = [];
  try {
    if (mode === 'password') {
      passwords = generatePassword({
        length,
        includeUppercase: useUpper,
        includeLowercase: useLower,
        includeNumbers: useNumbers,
        includeSymbols: useSymbols,
        excludeAmbiguous,
        count,
      });
    } else {
      passwords = generatePassphrase({
        wordCount,
        separator,
        capitalize,
        count,
      });
    }
  } catch (err) {
    passwords = [];
  }

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
          className={\`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors \${
            mode === 'password'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }\`}
        >
          Random Password (High Entropy)
        </button>
        <button
          onClick={() => setMode('passphrase')}
          className={\`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors \${
            mode === 'passphrase'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }\`}
        >
          Passphrase Mode (EFF Words)
        </button>
      </div>

      {/* Primary Display */}
      {primary && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="font-mono text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-all">
              {primary.value}
            </span>
            <button
              onClick={() => handleCopy(primary.value, 0)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold whitespace-nowrap"
            >
              {copiedIdx === 0 ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Entropy: <strong className="text-slate-800 dark:text-slate-200">{primary.entropyBits} bits</strong></span>
            <span>•</span>
            <span className={\`font-semibold \${
              primary.strength === 'Very strong'
                ? 'text-emerald-600 dark:text-emerald-400'
                : primary.strength === 'Strong'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-amber-600'
            }\`}>
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
`;

writeToolContent('strong-password-generator', strongPassSite, strongPassFaqs, strongPassExplainer);
writeToolComponent('strong-password-generator', strongPassToolTsx);
console.log('✓ Populated strong-password-generator');
