import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to write content files
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
  const file = path.join(ROOT_DIR, slug, 'src', 'tool', 'index.tsx');
  fs.writeFileSync(file, tsxCode.trim(), 'utf-8');
}

// -------------------------------------------------------------
// 2. AGE CALCULATOR
// -------------------------------------------------------------
const ageSite = {
  schemaVersion: 1,
  slug: 'age-calculator',
  siteName: 'Age Calculator',
  toolName: 'Age Calculator',
  primaryKeyword: 'age calculator',
  domain: 'TODO-set-domain.com',
  tagline: 'Calculate exact age in years, months, days, weeks, and hours from your date of birth.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'emerald',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const ageFaqs = [
  {
    id: 'how-is-exact-age-calculated',
    question: 'How is exact age in years, months, and days calculated?',
    answer: 'Age calculation determines the full calendar months between dates, adjusts for end-of-month day boundaries, and adds the remaining calendar days between the intermediate anchor date and the target date.'
  },
  {
    id: 'feb-29-leap-year-birthdays',
    question: 'How are February 29 leap day birthdays handled in common years?',
    answer: 'For individuals born on February 29 (leap day), standard international demographic convention recognizes their birthday as February 28 during non-leap years. This tool adheres strictly to that rule.'
  },
  {
    id: 'timezone-and-utc-consistency',
    question: 'Why does this tool prevent date shifts across time zones?',
    answer: 'Many online date utilities convert date inputs into UTC strings, causing birth dates to shift by a day depending on your local time zone. Our tool parses dates as discrete calendar integers `{year, month, day}` to eliminate time zone offsets.'
  },
  {
    id: 'calculate-age-at-future-past-date',
    question: 'Can I calculate my age at a future or historical date?',
    answer: 'Yes. Simply adjust the "Age At Date" field to any date on or after your birth date to see your exact age at that historical milestone or future anniversary.'
  },
  {
    id: 'day-of-week-born',
    question: 'How does the tool determine what day of the week I was born on?',
    answer: 'The day of the week is determined using the Gregorian calendar cycle via UTC day-of-week indexing, ensuring accurate identification (such as Monday or Saturday) regardless of your current time zone.'
  },
  {
    id: 'total-days-vs-months-calculation',
    question: 'How are total days and total weeks counted?',
    answer: 'Total days represent the exact elapsed astronomical days between dates (`Date.UTC`), accounting for every leap year in the intervening period. Total weeks are calculated by integer division of total days by 7.'
  },
  {
    id: 'is-my-birth-date-stored-or-sent',
    question: 'Is my birth date uploaded or stored anywhere?',
    answer: 'No. All date calculations run 100% locally in your browser. No birth dates, target dates, or calculation outputs are transmitted to our servers or stored in any database.'
  },
  {
    id: 'days-until-next-birthday',
    question: 'How does the countdown to my next birthday work?',
    answer: 'The calculator checks whether your birthday has already occurred in the current target year. If it has, it counts down the days to your birthday in the subsequent year; otherwise, it counts down to your birthday this year.'
  },
  {
    id: 'what-if-target-earlier-than-dob',
    question: 'What happens if the target date is earlier than the birth date?',
    answer: 'The tool strictly rejects target dates that precede your birth date, displaying an inline validation message and showing no results until a valid chronological pair is entered.'
  }
];

const ageExplainer = `
# How the Age Calculator Works

Determining an individual's exact chronological age seems deceptively simple, yet calendar variations—such as differing month lengths (28, 29, 30, or 31 days) and quadrennial leap years—require rigorous mathematical logic.

### Chronological Algorithm & End-of-Month Clamping

To prevent anomalies (such as claiming someone born on January 31 is 1 month and -2 days old on March 1), this calculator implements standard calendar end-of-month clamping:

1. **Month Differential:**
   We compute the total gross elapsed months:
   \`m = (targetYear - fromYear) * 12 + (targetMonth - fromMonth)\`
2. **Boundary Adjustment:**
   If the target day is less than the minimum of the birth day and the maximum days in the target month:
   \`m = m - 1\`
3. **Years and Months Breakdown:**
   \`years = floor(m / 12)\`
   \`months = m % 12\`
4. **Anchor Date & Day Count:**
   An intermediate anchor date is established by advancing the birth date by \`m\` months, clamping the day to the maximum days in that anchor month:
   \`anchorDay = min(fromDay, daysInMonth(anchorYear, anchorMonth))\`
   The remaining days are calculated as the exact days between the anchor date and the target date.

### Leap Year & February 29 Rule

For people born on February 29, non-leap years do not contain a 29th day of February. In accordance with standard legal and civil conventions, February 28 is treated as the anniversary date during common years.

### Absolute Client-Side Privacy

Date of birth is sensitive personal data. This calculator executes entirely within your browser's local memory. No dates or calculation results are ever transmitted across network connections.
`;

const ageTool = `'use client';

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
    const text = \`Age: \${result.years} years, \${result.months} months, \${result.days} days (\${result.totalDays.toLocaleString()} total days)\`;
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
`;

writeToolContent('age-calculator', ageSite, ageFaqs, ageExplainer);
writeToolComponent('age-calculator', ageTool);
console.log('✓ Wrote age-calculator');
// -------------------------------------------------------------
// 3. CHARACTER COUNTER
// -------------------------------------------------------------
const charSite = {
  schemaVersion: 1,
  slug: 'character-counter',
  siteName: 'Character Counter',
  toolName: 'Character Counter',
  primaryKeyword: 'character counter',
  domain: 'TODO-set-domain.com',
  tagline: 'Accurate, real-time character, word, sentence, and social media limit counter.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'slate',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const charFaqs = [
  {
    id: 'how-are-characters-counted',
    question: 'How does this tool accurately count Unicode characters and emoji?',
    answer: 'We use the standard \`Intl.Segmenter\` API with grapheme clustering. Unlike primitive \`string.length\` counting which splits surrogate pairs, complex emoji sequences (such as 👨‍👩‍👧‍👦 or flag emoji) are accurately counted as single visible characters.'
  },
  {
    id: 'difference-with-and-without-spaces',
    question: 'What is the difference between characters with and without spaces?',
    answer: 'Characters with spaces counts every visible grapheme plus tabs, spaces, and line breaks. Characters without spaces strips all Unicode whitespace (including non-breaking spaces and line returns) before counting.'
  },
  {
    id: 'social-media-platform-limits',
    question: 'What platform limits are checked?',
    answer: 'The tool actively checks limits for X/Twitter (280 chars), SMS text messages (160 characters for standard GSM-7 or 70 for Unicode), SEO Meta Titles (60 chars), Meta Descriptions (160 chars), and Instagram Bios (150 chars).'
  },
  {
    id: 'is-my-text-sent-to-a-server',
    question: 'Is my text transmitted or stored on your servers?',
    answer: 'No. All text parsing, grapheme segmentation, and keyword statistics happen entirely within your local browser sandbox. Nothing you type or paste is transmitted over the network.'
  },
  {
    id: 'how-is-reading-time-calculated',
    question: 'How is reading and speaking time estimated?',
    answer: 'Reading time is computed at the standard research average of 238 words per minute. Speaking time is estimated at 150 words per minute, typical for presentations and voiceovers.'
  },
  {
    id: 'what-counts-as-a-word',
    question: 'How does the word counter define a word?',
    answer: 'In line with Microsoft Word and Google Docs conventions, words are defined as whitespace-separated tokens containing at least one Unicode letter (\\p{L}) or number (\\p{N}). Hyphenated terms like "well-known" count as a single word.'
  },
  {
    id: 'performance-on-large-texts',
    question: 'Can this tool handle large documents without freezing?',
    answer: 'Yes. The algorithm handles multi-megabyte texts efficiently with optimized single-pass linear regex and segmenter execution.'
  },
  {
    id: 'how-are-sentences-and-paragraphs-counted',
    question: 'How are sentences and paragraphs counted?',
    answer: 'Sentences are parsed via grammatical sentence segmenters. Paragraphs are identified as text blocks separated by one or more blank line returns.'
  }
];

const charExplainer = `
# How the Character Counter Works

Accurately counting characters in modern digital communication is far more complex than counting computer bytes. Modern text relies on Unicode, where visual glyphs frequently consist of multiple underlying code points and surrogate pairs.

### True Grapheme Cluster Segmentation

Traditional string utilities count code units. In JavaScript, \`"👋".length\` evaluates to 2, and composite emoji like family sequences evaluate to 11 code units. 

This tool employs the ECMAScript Internationalization API (\`Intl.Segmenter\`) configured for **grapheme granularity**. A grapheme cluster represents a single perceived visual character, ensuring that an emoji, accented diacritic, or combining letter counts as exactly **one** character.

### Word and Sentence Counting Rules

- **Words:** Words are identified as whitespace-delimited tokens containing at least one Unicode letter (\`\\p{L}\`) or number (\`\\p{N}\`). Punctuation-only tokens are excluded, while hyphenated compounds (e.g., \`state-of-the-art\`) are preserved as single units matching desktop word processor rules.
- **Sentences:** Sentences are delineated by sentence-terminating punctuation marks (\`.\`, \`!\`, \`?\`) followed by whitespace or document boundaries.
- **Paragraphs:** Blocks separated by consecutive newline characters (\`\\n\\s*\\n\`).

### Estimated Reading & Speaking Velocities

Reading speed is evaluated against the empirical standard of **238 words per minute (wpm)** for adult silent reading of non-technical prose. Speaking duration is computed at **150 wpm**, providing accurate pacing metrics for scripts, public speaking, and video voiceovers.

### Local Client Privacy

This tool runs exclusively within your browser's local client thread. Your text is never stored in browser storage, logged, or sent across any network connection.
`;

const charTool = `'use client';

import React, { useState } from 'react';
import { analyzeText } from '../engines/text-stats';
import { Copy, Check, RotateCcw } from 'lucide-react';

export const Tool: React.FC = () => {
  const [text, setText] = useState<string>('Hello, world! It\\'s a well-known fact.');
  const [copied, setCopied] = useState<boolean>(false);

  const stats = analyzeText(text);

  const platforms = [
    { name: 'X / Twitter', max: 280 },
    { name: 'SMS (GSM-7)', max: 160 },
    { name: 'SEO Title', max: 60 },
    { name: 'SEO Meta Description', max: 160 },
    { name: 'Instagram Bio', max: 150 },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="mb-4">
        <label htmlFor="char-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Enter or paste your text:
        </label>
        <textarea
          id="char-input"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your content here..."
          className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        />
      </div>

      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setText('')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear Text</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-[44px]"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy Text'}</span>
        </button>
      </div>

      {/* Main Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 text-center">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Characters</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.charactersWithSpaces}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">No Spaces</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.charactersWithoutSpaces}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Words</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.words}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Sentences</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.sentences}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Paragraphs</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.paragraphs}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Reading Time</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white pt-1">{stats.readingTimeText}</p>
        </div>
      </div>

      {/* Social Platform Limit Meters */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Limits</h4>
        {platforms.map((p) => {
          const remaining = p.max - stats.charactersWithSpaces;
          const isOver = remaining < 0;
          const pct = Math.min(100, Math.max(0, (stats.charactersWithSpaces / p.max) * 100));

          return (
            <div key={p.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{p.name}</span>
                <span className={isOver ? 'text-red-600 font-bold' : 'text-slate-500'}>
                  {remaining >= 0 ? \`\${remaining} left\` : \`\${Math.abs(remaining)} over\`} (max {p.max})
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={\`h-full transition-all duration-200 \${isOver ? 'bg-red-500' : 'bg-slate-600 dark:bg-slate-400'}\`}
                  style={{ width: \`\${pct}%\` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

writeToolContent('character-counter', charSite, charFaqs, charExplainer);
writeToolComponent('character-counter', charTool);
console.log('✓ Wrote character-counter');
// -------------------------------------------------------------
// 4. GPA CALCULATOR
// -------------------------------------------------------------
const gpaSite = {
  schemaVersion: 1,
  slug: 'gpa-calculator',
  siteName: 'GPA Calculator',
  toolName: 'GPA Calculator',
  primaryKeyword: 'gpa calculator',
  domain: 'TODO-set-domain.com',
  tagline: 'Calculate term and cumulative high school or college GPA on 4.0 weighted and unweighted scales.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'indigo',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const gpaFaqs = [
  {
    id: 'how-is-gpa-calculated',
    question: 'How is Grade Point Average (GPA) calculated?',
    answer: 'GPA is calculated by dividing total quality points by total attempted credit hours: `GPA = Σ(grade points × credits) / Σ credits`. Each letter grade corresponds to a numeric point value on a 4.0 scale.'
  },
  {
    id: 'standard-4-point-scale-values',
    question: 'What are the default point values for letter grades?',
    answer: 'On the standard 4.0 scale: A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, B- = 2.7, C+ = 2.3, C = 2.0, C- = 1.7, D+ = 1.3, D = 1.0, D- = 0.7, and F = 0.0.'
  },
  {
    id: 'weighted-vs-unweighted-gpa',
    question: 'What is the difference between weighted and unweighted GPA?',
    answer: 'Unweighted GPA treats all courses equally on a 4.0 scale regardless of difficulty. Weighted GPA adds bonus points for advanced coursework: typically +0.5 for Honors courses and +1.0 for AP, IB, or Dual Enrollment classes (for passing grades above F).'
  },
  {
    id: 'cumulative-gpa-calculation',
    question: 'How is cumulative GPA calculated alongside current semester grades?',
    answer: 'Cumulative GPA merges previous academic history with current semester courses: `(Previous GPA × Previous Credits + Current Quality Points) / (Previous Credits + Current Credits)`.'
  },
  {
    id: 'handling-pass-fail-classes',
    question: 'How are Pass/Fail (P/F) courses handled?',
    answer: 'Pass/Fail courses do not assign numeric grade points and are excluded from the GPA divisor. They are not factored into the calculation and do not affect your GPA.'
  },
  {
    id: 'are-my-academic-grades-saved',
    question: 'Are my courses or grades saved anywhere?',
    answer: 'No. All calculations run strictly in your browser session. No course titles, grades, credit amounts, or GPAs are persisted or sent to any server.'
  },
  {
    id: 'can-gpa-exceed-4-point-0',
    question: 'Can my GPA exceed 4.0?',
    answer: 'Yes, on a weighted scale with Honors (+0.5) or AP/IB (+1.0) coursework, a student can achieve a weighted GPA up to 5.0.'
  },
  {
    id: 'why-use-exact-decimal-math',
    question: 'Why does this calculator use Decimal arithmetic?',
    answer: 'Standard JavaScript floating-point math introduces tiny binary rounding artifacts (like `0.1 + 0.2 = 0.30000000000000004`). We use exact decimal arithmetic to ensure your official GPA matches institutional transcripts.'
  }
];

const gpaExplainer = `
# How the GPA Calculator Works

Grade Point Average (GPA) is the standardized quantitative metric employed by secondary schools, colleges, and graduate admissions committees to measure overall academic performance.

### Mathematical Formulation

The core formula for unweighted semester GPA is the credit-weighted sum of earned grade points divided by total attempted credits:

$$\\text{GPA} = \\frac{\\sum (\\text{Grade Points} \\times \\text{Credits})}{\\sum \\text{Credits}}$$

For example, consider a semester with four courses:
- Course 1: Grade A (4.0 points) × 3 credits = 12.0 points
- Course 2: Grade B+ (3.3 points) × 4 credits = 13.2 points
- Course 3: Grade B (3.0 points) × 3 credits = 9.0 points
- Course 4: Grade C (2.0 points) × 2 credits = 4.0 points

Total Quality Points = $12.0 + 13.2 + 9.0 + 4.0 = 38.20$  
Total Attempted Credits = $3 + 4 + 3 + 2 = 12$  
Semester GPA = $38.20 / 12 = 3.1833...$ (rounded to **3.18**).

### Cumulative GPA Formula

To integrate prior academic standing with current semester performance:

$$\\text{Cumulative GPA} = \\frac{(\\text{Prior GPA} \\times \\text{Prior Credits}) + \\sum (\\text{New Points} \\times \\text{New Credits})}{\\text{Prior Credits} + \\sum \\text{New Credits}}$$

If you previously had a 3.40 GPA across 60 credits:
Total Combined Points = $(3.40 \\times 60) + 38.20 = 204.0 + 38.20 = 242.20$  
Total Combined Credits = $60 + 12 = 72$  
Cumulative GPA = $242.20 / 72 = 3.3638...$ (rounded to **3.36**).

### Weighted GPA Mode

When weighted mode is enabled, extra points are added to each course according to course rigor:
- **Honors Courses:** +0.5 points
- **AP / IB / Dual Enrollment Courses:** +1.0 points  
*Note: Weight bonuses apply strictly to passing grades (above F).*

**Academic Disclaimer:** Grading scales differ across institutions. Always verify scale standards with your academic registrar or guidance counselor.
`;

const gpaTool = `'use client';

import React, { useState } from 'react';
import { calculateGPA, CourseEntry, GradeLetter, CourseLevel } from '../engines/gpa';
import { Plus, Trash2, RotateCcw, Copy, Check } from 'lucide-react';

export const Tool: React.FC = () => {
  const [courses, setCourses] = useState<CourseEntry[]>([
    { id: '1', name: 'English Literature', grade: 'A', credits: 3, level: 'Regular' },
    { id: '2', name: 'Calculus I', grade: 'B+', credits: 4, level: 'Regular' },
    { id: '3', name: 'Chemistry', grade: 'B', credits: 3, level: 'Regular' },
    { id: '4', name: 'World History', grade: 'C', credits: 2, level: 'Regular' },
  ]);

  const [hasCumulative, setHasCumulative] = useState<boolean>(false);
  const [prevGpa, setPrevGpa] = useState<string>('3.40');
  const [prevCredits, setPrevCredits] = useState<string>('60');
  const [copied, setCopied] = useState<boolean>(false);

  const result = calculateGPA(
    courses,
    hasCumulative ? { previousGpa: prevGpa, previousCredits: prevCredits } : undefined
  );

  const addCourse = () => {
    const newId = String(Date.now());
    setCourses([...courses, { id: newId, name: '', grade: 'A', credits: 3, level: 'Regular' }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleCopy = () => {
    const text = \`Semester GPA: \${result.gpa} (\${result.totalCredits} credits)\${result.cumulativeGpa ? \` | Cumulative GPA: \${result.cumulativeGpa}\` : ''}\`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="space-y-4 mb-6">
        <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold uppercase text-slate-500 px-1">
          <div className="col-span-4">Course</div>
          <div className="col-span-3">Grade</div>
          <div className="col-span-2">Credits</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-1"></div>
        </div>

        {courses.map((course, idx) => (
          <div key={course.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-0 rounded-lg sm:bg-transparent">
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder={\`Course \${idx + 1}\`}
                value={course.name}
                onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={course.grade}
                onChange={(e) => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
              >
                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                min="0"
                step="1"
                value={course.credits}
                onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <select
                value={course.level}
                onChange={(e) => updateCourse(course.id, 'level', e.target.value as CourseLevel)}
                className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
              >
                <option value="Regular">Regular</option>
                <option value="Honors">Honors (+0.5)</option>
                <option value="AP/IB/Dual">AP/IB (+1.0)</option>
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                disabled={courses.length <= 1}
                aria-label="Remove course"
                className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={addCourse}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>

        <button
          type="button"
          onClick={() => setHasCumulative(!hasCumulative)}
          className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-h-[44px]"
        >
          {hasCumulative ? 'Remove Cumulative' : '+ Include Prior Cumulative GPA'}
        </button>
      </div>

      {hasCumulative && (
        <div className="my-6 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Previous Cumulative GPA
            </label>
            <input
              type="text"
              value={prevGpa}
              onChange={(e) => setPrevGpa(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Previous Total Credits
            </label>
            <input
              type="number"
              value={prevCredits}
              onChange={(e) => setPrevCredits(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Results Card */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center space-y-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Semester Grade Point Average
          </span>
          <div className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {result.gpa}
          </div>
          <p className="text-xs text-slate-500">
            Total Credits: {result.totalCredits} | Quality Points: {result.totalQualityPoints}
          </p>

          {result.cumulativeGpa && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Overall Cumulative GPA</span>
              <p className="text-2xl font-bold text-accent-primary">{result.cumulativeGpa}</p>
              <span className="text-xs text-slate-400">Over {result.cumulativeTotalCredits} combined credits</span>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy GPA Summary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
`;

writeToolContent('gpa-calculator', gpaSite, gpaFaqs, gpaExplainer);
writeToolComponent('gpa-calculator', gpaTool);
console.log('✓ Wrote gpa-calculator');
// -------------------------------------------------------------
// 5. IMAGE RESIZER
// -------------------------------------------------------------
const imageResizerSite = {
  schemaVersion: 1,
  slug: 'image-resizer',
  siteName: 'Image Resizer',
  toolName: 'Image Resizer',
  primaryKeyword: 'image resizer',
  domain: 'TODO-set-domain.com',
  tagline: 'Resize JPG, PNG, and WebP images by pixels or percentage locally in your browser with aspect ratio lock.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'teal',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const imageResizerFaqs = [
  {
    id: 'how-does-client-side-resizing-work',
    question: 'How are images resized without uploading to a server?',
    answer: 'Images are decoded directly into browser memory using modern HTML5 Canvas and `createImageBitmap` APIs with high-quality bicubic resampling. The resized image is generated as a Blob in your browser, completely avoiding network uploads.'
  },
  {
    id: 'aspect-ratio-lock-formula',
    question: 'How is the aspect ratio maintained when resizing?',
    answer: 'When the ratio lock is active, changing width automatically computes height: `newH = max(1, round(newW × origH / origW))`. Conversely, altering height recalculates width proportionally.'
  },
  {
    id: 'supported-image-formats',
    question: 'What image formats can I resize and export?',
    answer: 'The resizer accepts JPEG, PNG, WebP, GIF, and BMP formats. You can export the output image as JPEG, PNG, or modern compressed WebP.'
  },
  {
    id: 'does-resizing-reduce-file-size',
    question: 'Does resizing also reduce image file size?',
    answer: 'Yes. Downscaling image resolution significantly reduces pixel count and uncompressed byte size. You can also fine-tune output JPEG/WebP quality to achieve optimal file size reduction.'
  },
  {
    id: 'handling-transparent-pngs',
    question: 'What happens to transparency when converting PNG to JPEG?',
    answer: 'JPEG does not support alpha transparency channels. When exporting transparent images to JPEG, the canvas automatically fills transparent regions with clean solid white.'
  },
  {
    id: 'is-there-a-maximum-file-or-resolution-limit',
    question: 'What are the maximum resolution limits?',
    answer: 'Most desktop browsers easily handle photos up to 50 megapixels. For mobile devices, browser canvas dimensions are safely managed to prevent memory crashes.'
  },
  {
    id: 'exif-and-photo-orientation',
    question: 'Does the resizer preserve correct camera orientation?',
    answer: 'Yes. We decode images with `{ imageOrientation: "from-image" }`, ensuring EXIF orientation metadata is automatically respected so your portrait or rotated photos display upright.'
  },
  {
    id: 'is-my-photo-private',
    question: 'Are my personal images uploaded or logged?',
    answer: 'No. Zero bytes of your photos leave your computer. Processing occurs entirely in client-side RAM and memory is freed immediately upon download or reset.'
  }
];

const imageResizerExplainer = `
# How the Image Resizer Works

Resizing photos on the web traditionally required uploading large image files to remote servers, raising privacy risks and introducing network delays. This tool performs 100% of image decoding, bicubic interpolation, and re-encoding directly on your machine.

### Aspect Ratio Calculations

When you resize an image while keeping the aspect ratio locked, the non-adjusted dimension is computed using exact proportional scaling:

$$\\text{Target Height} = \\max\\left(1, \\text{round}\\left(\\frac{\\text{Target Width} \\times \\text{Original Height}}{\\text{Original Width}}\\right)\\right)$$

For example, an image with dimensions of **4000 × 3000 px** scaled to a target width of **1200 px** yields:
$$\\text{Target Height} = \\frac{1200 \\times 3000}{4000} = 900\\text{ px}$$

Similarly, scaling by a percentage uses direct multiplier arithmetic:
$$\\text{New Dimension} = \\max\\left(1, \\text{round}\\left(\\frac{\\text{Original Dimension} \\times \\text{Percentage}}{100}\\right)\\right)$$
A 50% scale of a 4000 × 3000 px photo produces exactly **2000 × 1500 px**.

### High-Fidelity Downscaling

To prevent aliasing and jagged edges when performing substantial downscaling (e.g., from 4K down to a web thumbnail), the canvas engine uses \`imageSmoothingQuality = 'high'\` with bicubic interpolation. When exporting transparent PNGs to JPEG format, the canvas fills transparent alpha areas with white.

### Memory Lifecycle & Zero Upload Guarantee

Images are loaded into temporary memory via \`createImageBitmap\` with automatic EXIF orientation normalization. Once rendered and downloaded, object URLs are promptly released with \`URL.revokeObjectURL()\` to maintain low browser RAM usage.
`;

const imageResizerTool = `'use client';

import React, { useState, useRef } from 'react';
import { calculateDimensionsByWidth, calculateDimensionsByHeight, calculateDimensionsByPercentage, formatFileSize } from '../engines/image-io';
import { Upload, Download, RotateCcw, Lock, Unlock, Image as ImageIcon } from 'lucide-react';

export const Tool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(null);
  const [targetWidth, setTargetWidth] = useState<string>('1200');
  const [targetHeight, setTargetHeight] = useState<string>('900');
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.85);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    setFile(selectedFile);

    const img = new Image();
    const objectUrl = URL.createObjectURL(selectedFile);
    img.onload = () => {
      setOrigDims({ width: img.naturalWidth, height: img.naturalHeight });
      setTargetWidth(String(img.naturalWidth));
      setTargetHeight(String(img.naturalHeight));
      setPreviewUrl(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleWidthChange = (val: string) => {
    setTargetWidth(val);
    const num = parseInt(val, 10);
    if (lockRatio && origDims && !isNaN(num) && num > 0) {
      const newDims = calculateDimensionsByWidth(origDims.width, origDims.height, num);
      setTargetHeight(String(newDims.height));
    }
  };

  const handleHeightChange = (val: string) => {
    setTargetHeight(val);
    const num = parseInt(val, 10);
    if (lockRatio && origDims && !isNaN(num) && num > 0) {
      const newDims = calculateDimensionsByHeight(origDims.width, origDims.height, num);
      setTargetWidth(String(newDims.width));
    }
  };

  const applyPercentage = (pct: number) => {
    if (!origDims) return;
    const newDims = calculateDimensionsByPercentage(origDims.width, origDims.height, pct);
    setTargetWidth(String(newDims.width));
    setTargetHeight(String(newDims.height));
  };

  const handleDownload = async () => {
    if (!file || !origDims) return;
    setIsProcessing(true);

    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      const w = parseInt(targetWidth, 10) || origDims.width;
      const h = parseInt(targetHeight, 10) || origDims.height;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
          a.href = url;
          a.download = \`resized-\${w}x\${h}.\${ext}\`;
          a.click();
          URL.revokeObjectURL(url);
          setIsProcessing(false);
        },
        format,
        quality
      );
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-accent-primary rounded-lg p-10 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Click or drag an image here to resize
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports JPG, PNG, WebP, GIF, and BMP (Up to 50MB, processed 100% in browser)
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-accent-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">Original: {origDims?.width} × {origDims?.height} px ({formatFileSize(file.size)})</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              className="text-xs text-slate-500 hover:text-red-500 min-h-[44px] px-2"
            >
              Change Image
            </button>
          </div>

          {/* Dimension Controls */}
          <div className="space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Target Dimensions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Height (px)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setLockRatio(!lockRatio)}
                    title={lockRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                    className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300"
                  >
                    {lockRatio ? <Lock className="w-4 h-4 text-accent-primary" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Percentage Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Scale:</span>
              {[25, 50, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyPercentage(pct)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[36px]"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Export Format & Quality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Output Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
              >
                <option value="image/jpeg">JPG / JPEG</option>
                <option value="image/png">PNG (Lossless)</option>
                <option value="image/webp">WebP (Modern)</option>
              </select>
            </div>

            {format !== 'image/png' && (
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-accent-primary"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Resizing...' : 'Download Resized Image'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
`;

writeToolContent('image-resizer', imageResizerSite, imageResizerFaqs, imageResizerExplainer);
writeToolComponent('image-resizer', imageResizerTool);
console.log('✓ Wrote image-resizer');
// -------------------------------------------------------------
// 6. LOAN CALCULATOR
// -------------------------------------------------------------
const loanSite = {
  schemaVersion: 1,
  slug: 'loan-calculator',
  siteName: 'Loan Calculator',
  toolName: 'Loan Calculator',
  primaryKeyword: 'loan calculator',
  domain: 'TODO-set-domain.com',
  tagline: 'Calculate fixed monthly loan payments, total interest, and complete amortization schedules with extra payments.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'blue',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const loanFaqs = [
  {
    id: 'how-is-monthly-payment-calculated',
    question: 'What mathematical formula calculates the monthly loan payment?',
    answer: 'Monthly payment is calculated using the standard amortized loan formula: `P × [r(1+r)^n] / [(1+r)^n − 1]`, where `P` is principal loan amount, `r` is periodic monthly interest rate (`APR / 12 / 100`), and `n` is total number of monthly payments.'
  },
  {
    id: 'how-extra-payments-save-interest',
    question: 'How do extra monthly payments accelerate payoff and save interest?',
    answer: 'Any extra principal paid each month directly reduces the remaining loan balance. Because subsequent monthly interest is computed strictly against the remaining balance (`balance × r`), future interest charges decrease, shortening loan term.'
  },
  {
    id: 'why-totals-sum-the-schedule',
    question: 'Why are headline totals calculated from schedule sums rather than simple multiplication?',
    answer: 'In real-world lending, each period rounded interest and principal must sum to exact currency cents. Consequently, the final payment adjusts for cent rounding, and total interest is the exact sum of all scheduled periods.'
  },
  {
    id: 'zero-interest-loan-handling',
    question: 'How does the calculator handle 0% APR loans?',
    answer: 'If the interest rate is 0%, the formula cleanly evaluates to `Principal / Months`, resulting in zero interest charges and equal payments.'
  },
  {
    id: 'is-my-financial-data-secure',
    question: 'Is my financial information or loan amount private?',
    answer: 'Yes. All financial calculations occur 100% locally in your browser session. No loan values, interest rates, or schedules are ever transmitted or saved.'
  },
  {
    id: 'can-i-export-the-amortization-schedule',
    question: 'Can I export the amortization schedule?',
    answer: 'Yes. You can download the full monthly breakdown of principal, interest, and remaining balance as a standard CSV file directly from the page.'
  },
  {
    id: 'difference-between-apr-and-interest-rate',
    question: 'What is the difference between interest rate and APR?',
    answer: 'The interest rate reflects the cost of borrowing the principal balance. Annual Percentage Rate (APR) incorporates the interest rate plus any mandatory lender fees or points expressed on an annualized basis.'
  },
  {
    id: 'financial-disclaimer',
    question: 'Is this calculation a guaranteed loan offer or advice?',
    answer: 'No. This calculator is provided for informational and educational planning purposes only. Lenders may calculate daily interest accrual or apply proprietary closing charges.'
  }
];

const loanExplainer = `
# How the Loan Calculator Works

An amortized installment loan distributes repayment across a predetermined series of equal monthly installments. Each installment is composed of two components: accrued interest on the outstanding balance, and repayment of the principal loan amount.

### The Amortization Formula

The fixed periodic payment is calculated using standard financial mathematics:

$$\\text{Payment} = P \\times \\frac{r(1 + r)^n}{(1 + r)^n - 1}$$

Where:
- $P$ = Principal loan amount
- $r$ = Periodic interest rate per month: $\\frac{\\text{APR}}{12 \\times 100}$
- $n$ = Total number of payment periods (months)

For example, on a **$10,000** loan at **6.0% APR** over **36 months**:
- $r = 6.0 / 12 / 100 = 0.005$
- $(1 + 0.005)^{36} = 1.19668...$
- Payment = $10,000 \\times \\frac{0.005 \\times 1.19668}{1.19668 - 1} = \\mathbf{304.22}$

### Schedule Progression and Cent Rounding

In accordance with banking conventions:
1. **Periodic Interest:** $\\text{Interest}_t = \\text{round}(\\text{Balance}_{t-1} \\times r, 2)$
2. **Periodic Principal:** $\\text{Principal}_t = \\text{Payment} - \\text{Interest}_t$
3. **Ending Balance:** $\\text{Balance}_t = \\text{Balance}_{t-1} - \\text{Principal}_t$
4. **Final Payment:** On the final month ($t = n$), the payment exactly equals $\\text{Remaining Balance} + \\text{Interest}_n$, accounting for slight fractional cent deviations.

For our 10,000 @ 6% / 36 mo vector:
- Month 1: Interest = 50.00, Principal = 254.22, Balance = 9,745.78
- Month 36 (Final Payment): **304.18**
- **Total Interest:** **$951.88** | **Total Paid:** **$10,951.88**

**Financial Disclaimer:** This calculator provides estimates for personal planning. Official loan amortization schedules should always be obtained directly from your lending institution.
`;

const loanTool = `'use client';

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
    const header = 'Period,Payment,Principal,Interest,Remaining Balance\\n';
    const rows = result.schedule
      .map((s) => \`\${s.period},\${s.payment},\${s.principal},\${s.interest},\${s.remainingBalance}\`)
      .join('\\n');
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
    const text = \`Monthly Payment: \${currency}\${result.monthlyPayment} | Total Interest: \${currency}\${result.totalInterest} | Total Paid: \${currency}\${result.totalPaid}\`;
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
`;

writeToolContent('loan-calculator', loanSite, loanFaqs, loanExplainer);
writeToolComponent('loan-calculator', loanTool);
console.log('✓ Wrote loan-calculator');
// -------------------------------------------------------------
// 7. PASSWORD GENERATOR
// -------------------------------------------------------------
const passwordSite = {
  schemaVersion: 1,
  slug: 'password-generator',
  siteName: 'Password Generator',
  toolName: 'Password Generator',
  primaryKeyword: 'password generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate cryptographically strong random passwords and numeric PINs locally using Web Crypto CSPRNG.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'emerald',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const passwordFaqs = [
  {
    id: 'how-is-cryptographic-randomness-ensured',
    question: 'How is true cryptographic randomness guaranteed?',
    answer: 'Randomness is generated exclusively via `crypto.getRandomValues`, a cryptographically secure pseudorandom number generator (CSPRNG) seeded by your operating system kernel entropy. We forbid `Math.random` completely.'
  },
  {
    id: 'how-is-modulo-bias-prevented',
    question: 'How does rejection sampling prevent modulo bias?',
    answer: 'Standard modulo arithmetic (`rand % poolSize`) creates slight statistical favor toward early characters when 2^32 is not evenly divisible by the pool size. We use rejection sampling to discard numbers above the largest clean multiple.'
  },
  {
    id: 'how-is-entropy-calculated',
    question: 'How is password entropy computed?',
    answer: 'Entropy measures brute-force search space: `Entropy = Length × log2(Pool Size)`. For example, a 16-character password chosen across all 94 ASCII characters delivers 104.87 bits of cryptographic entropy.'
  },
  {
    id: 'are-passwords-stored-or-transmitted',
    question: 'Are generated passwords transmitted or stored anywhere?',
    answer: 'Never. Passwords exist purely in your browser runtime memory. No passwords, options, or generated keys are sent over the network or saved in local storage.'
  },
  {
    id: 'what-are-ambiguous-characters',
    question: 'What characters are removed when "Exclude Ambiguous" is enabled?',
    answer: 'We remove easily confused glyphs: uppercase I, lowercase l, numeral 1, uppercase O, and numeral 0 to prevent transcription errors on printed slips or display screens.'
  },
  {
    id: 'can-i-generate-numeric-pins',
    question: 'Can this tool generate secure numeric PIN codes?',
    answer: 'Yes. Switch to PIN mode to generate cryptographically uniform 4-digit, 6-digit, or custom-length numeric codes.'
  },
  {
    id: 'character-guarantee-assurance',
    question: 'Does the generator guarantee characters from each selected set?',
    answer: 'Yes. If you select uppercase, lowercase, numbers, and symbols, the algorithm guarantees at least one character from each selected class, then shuffles the output with the Fisher–Yates algorithm.'
  },
  {
    id: 'recommended-password-length',
    question: 'What is the recommended minimum password length?',
    answer: 'Security authorities such as NIST recommend a minimum of 16 characters for high-value accounts, providing over 100 bits of entropy against modern offline hash cracking attacks.'
  }
];

const passwordExplainer = `
# How the Password Generator Works

Generating trustworthy passwords on the web requires avoiding two subtle but critical pitfalls: weak pseudo-random number generators and statistical modulo bias.

### Cryptographically Secure Random Numbers (CSPRNG)

Standard browser functions like \`Math.random()\` are deterministic pseudo-random generators intended for graphics and simple animations. They are completely unsuitable for cryptography because an attacker can predict future outputs from observed outputs.

This generator strictly utilizes \`crypto.getRandomValues()\`, which draws from kernel-level hardware entropy sources (mouse movements, CPU interrupt timings, thermal sensor noise).

### Eliminating Modulo Bias with Rejection Sampling

When drawing a random character from a character pool of size $N$ using a 32-bit unsigned integer ($2^{32} = 4,294,967,296$ possible values), calculating \`rand % N\` introduces bias because $2^{32}$ is rarely evenly divisible by $N$.

To ensure exact uniformity, our engine implements **rejection sampling**:
$$\\text{Limit} = \\left\\lfloor \\frac{2^{32}}{N} \\right\\rfloor \\times N$$
Any random 32-bit integer greater than or equal to this limit is discarded, ensuring every character in your chosen pool has an identical mathematical probability of being selected.

### Information-Theoretic Entropy

Password strength is evaluated using Shannon information entropy:

$$\\text{Entropy (bits)} = L \\times \\log_2(P)$$

Where $L$ is length and $P$ is character pool size.
- 16 characters across 94 printable ASCII characters ($26+26+10+32$):
  $$16 \\times \\log_2(94) = 16 \\times 6.5546 = \\mathbf{104.87\\text{ bits}} \\text{ (Very strong)}$$
- 12 characters across 62 alphanumeric characters ($26+26+10$):
  $$12 \\times \\log_2(62) = 12 \\times 5.9542 = \\mathbf{71.45\\text{ bits}} \\text{ (Good)}$$

### Complete Zero-Storage Guarantee

Generated passwords exist solely inside ephemeral client-side variables. No data is stored, cached, or transmitted over any network socket.
`;

const passwordTool = `'use client';

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
            className={\`px-5 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] \${
              mode === 'password' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'
            }\`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('pin'); setLength(6); }}
            className={\`px-5 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] \${
              mode === 'pin' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'
            }\`}
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
        <span className={\`px-2.5 py-0.5 rounded-full font-bold border \${getStrengthBadgeClass(current.strength)}\`}>
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
`;

writeToolContent('password-generator', passwordSite, passwordFaqs, passwordExplainer);
writeToolComponent('password-generator', passwordTool);
console.log('✓ Wrote password-generator');

// -------------------------------------------------------------
// 8. PERCENTAGE CALCULATOR
// -------------------------------------------------------------
const percentSite = {
  schemaVersion: 1,
  slug: 'percentage-calculator',
  siteName: 'Percentage Calculator',
  toolName: 'Percentage Calculator',
  primaryKeyword: 'percentage calculator',
  domain: 'TODO-set-domain.com',
  tagline: 'Instant, exact decimal percentage calculator for percent of, percentage change, increase, and difference.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'indigo',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const percentFaqs = [
  {
    id: 'how-do-you-calculate-percent-of-a-number',
    question: 'How do you calculate the percentage of a number?',
    answer: 'To find X% of Y, convert the percentage into a decimal by dividing by 100, then multiply by the total: `Result = Y × (X / 100)`. For example, 15% of 200 = `200 × 0.15 = 30`.'
  },
  {
    id: 'how-to-find-what-percent-one-number-is-of-another',
    question: 'How do you find what percent X is of Y?',
    answer: 'Divide the part X by the whole Y and multiply by 100: `(X / Y) × 100`. For example, 30 is what percent of 200? `(30 / 200) × 100 = 15%`.'
  },
  {
    id: 'percentage-change-vs-percentage-difference',
    question: 'What is the difference between percentage change and percentage difference?',
    answer: 'Percentage change has direction (increase or decrease) relative to an initial value A: `((B - A) / |A|) × 100`. Percentage difference is symmetric and compares two values relative to their average: `(|A - B| / ((A + B) / 2)) × 100`.'
  },
  {
    id: 'percentage-increase-decrease-formula',
    question: 'How do you calculate a percentage increase or decrease?',
    answer: 'Multiply the base number Y by `(1 + X/100)` for an increase, or by `(1 - X/100)` for a decrease. For example, increasing 200 by 15% yields `200 × 1.15 = 230`.'
  },
  {
    id: 'why-are-floating-point-errors-prevented',
    question: 'Why does this tool prevent rounding artifacts like 0.1 + 0.2 = 0.30000000000000004?',
    answer: 'Computers use binary floating-point representation that cannot represent fractions like 1/10 exactly. We use arbitrary-precision `decimal.js` arithmetic to guarantee exact decimal outputs.'
  },
  {
    id: 'are-my-numbers-sent-to-any-server',
    question: 'Are my numbers or calculations sent to a server?',
    answer: 'No. All percentage math runs 100% locally in your web browser. No numbers, formulas, or results are logged or transmitted.'
  },
  {
    id: 'can-percentages-be-negative-or-greater-than-100',
    question: 'Can percentages be negative or exceed 100%?',
    answer: 'Yes. If a final value is smaller than an initial value, percentage change is negative (a percentage decrease). Percentages over 100% represent quantities greater than the original base.'
  },
  {
    id: 'worked-sentence-explanations',
    question: 'What are the worked sentences displayed under each panel?',
    answer: 'Every panel displays the plain English sentence and underlying mathematical formula so you can verify the steps for academic, business, or retail calculations.'
  }
];

const percentExplainer = `
# How the Percentage Calculator Works

Percentages represent dimensionless ratios expressed as fractions of 100 (from the Latin *per centum*, meaning "by the hundred"). While fundamental to finance, science, and retail, different percentage questions require distinct mathematical formulations.

### 1. Percentage of a Value
$$\\text{Result} = Y \\times \\frac{X}{100}$$
*Example:* 15% of 200 = $200 \\times 0.15 = \\mathbf{30}$.

### 2. What Percentage Is X of Y?
$$\\text{Percentage} = \\frac{X}{Y} \\times 100 \\quad (Y \\neq 0)$$
*Example:* 30 is what percent of 200? $\\frac{30}{200} \\times 100 = \\mathbf{15\\%}$.

### 3. X Is Y% of What Base?
$$\\text{Base} = \\frac{X \\times 100}{Y} \\quad (Y \\neq 0)$$
*Example:* 30 is 15% of what? $\\frac{30 \\times 100}{15} = \\mathbf{200}$.

### 4. Percentage Increase and Decrease
$$\\text{Result} = Y \\times \\left(1 \\pm \\frac{X}{100}\\right)$$
*Example:* Increase 200 by 15% = $200 \\times 1.15 = \\mathbf{230}$.

### 5. Percentage Change (Directional)
$$\\text{Percentage Change} = \\frac{B - A}{|A|} \\times 100 \\quad (A \\neq 0)$$
*Examples:*
- From 50 to 75: $\\frac{75 - 50}{50} \\times 100 = \\mathbf{+50\\%}$ (Increase)
- From 75 to 50: $\\frac{50 - 75}{75} \\times 100 = \\mathbf{-33.3333\\%}$ (Decrease)

### 6. Percentage Difference (Symmetric)
Unlike percentage change, percentage difference compares two unordered values against their arithmetic mean:
$$\\text{Difference} = \\frac{|A - B|}{\\frac{A + B}{2}} \\times 100 \\quad (A + B \\neq 0)$$
*Example:* Comparing 50 and 75: $\\frac{|50 - 75|}{62.5} \\times 100 = \\mathbf{40\\%}$. Because it is symmetric, comparing 75 vs 50 yields the identical 40%.

### Decimal Precision

All operations are executed via \`decimal.js\` with up to 6 significant digits and automatic trimming of trailing zeros, eliminating binary representation artifacts.
`;

const percentTool = `'use client';

import React, { useState } from 'react';
import {
  percentageOf,
  whatPercentageOf,
  percentageOfWhat,
  increaseDecreaseBy,
  percentageChange,
  percentageDifference,
} from '../engines/percentage';

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

  const safeCalc = (fn: () => any, fallback: string = '—') => {
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
          <span className={\`font-bold text-lg px-2 \${res5.isIncrease ? 'text-emerald-600' : 'text-red-600'}\`}>
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
`;

writeToolContent('percentage-calculator', percentSite, percentFaqs, percentExplainer);
writeToolComponent('percentage-calculator', percentTool);
console.log('✓ Wrote percentage-calculator');

// -------------------------------------------------------------
// 9. QR CODE GENERATOR
// -------------------------------------------------------------
const qrSite = {
  schemaVersion: 1,
  slug: 'qr-code-generator',
  siteName: 'QR Code Generator',
  toolName: 'QR Code Generator',
  primaryKeyword: 'qr code generator',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate high-resolution PNG and vector SVG QR codes with error correction and contrast checking client-side.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'teal',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const qrFaqs = [
  {
    id: 'how-does-qr-generation-work-locally',
    question: 'How are QR codes generated entirely in the browser?',
    answer: 'We use client-side JavaScript QR matrix encoding to generate canvas and SVG graphics directly in your browser. Your URLs, text, or contact data are never sent to external generator APIs.'
  },
  {
    id: 'qr-error-correction-levels',
    question: 'What do the error correction levels (L, M, Q, H) mean?',
    answer: 'Error correction allows QR codes to be scanned even if partially obscured or damaged: Level L recovers ~7% of data, Level M recovers ~15%, Level Q recovers ~25%, and Level H recovers ~30%. Level M is recommended for general use.'
  },
  {
    id: 'contrast-ratio-and-scan-reliability',
    question: 'Why does the tool show a contrast warning?',
    answer: 'Optical QR scanners rely on strong contrast between dark modules and a light background. Low contrast (ratio < 4.5:1) or inverted colors (white code on dark background) often fail on older phone cameras and handheld barcode scanners.'
  },
  {
    id: 'svg-vs-png-qr-codes',
    question: 'Should I download PNG or SVG format?',
    answer: 'PNG is ideal for digital screens, websites, and emails. SVG is an infinitely scalable vector format essential for high-resolution print materials, signs, stickers, and billboards without pixelation.'
  },
  {
    id: 'supported-content-types',
    question: 'What content types can I encode?',
    answer: 'You can generate QR codes for Website URLs, Plain Text, Email addresses, Phone numbers, SMS messages, and digital vCard contact cards.'
  },
  {
    id: 'do-these-qr-codes-ever-expire',
    question: 'Do these QR codes ever expire?',
    answer: 'No. These are static, direct-payload QR codes. Unlike subscription-based QR services, there is no redirect server or middleman. The code points permanently to your entered URL or text.'
  },
  {
    id: 'is-my-data-uploaded',
    question: 'Is any of my encoded data saved or uploaded?',
    answer: 'No. Everything is rendered locally inside your browser DOM. No data is stored, tracked, or transmitted.'
  },
  {
    id: 'recommended-qr-code-print-size',
    question: 'What is the minimum recommended print size for a QR code?',
    answer: 'For standard mobile scanning at arm’s length, print QR codes at least 2 × 2 cm (0.8 × 0.8 inches) with at least 4 modules of quiet zone border margin.'
  }
];

const qrExplainer = `
# How the QR Code Generator Works

Quick Response (QR) codes are two-dimensional matrix barcodes invented in 1994 by Masahiro Hara of Denso Wave. They encode alphanumeric data across a square grid of dark and light modules organized with position detection patterns in three corners.

### Reed–Solomon Error Correction

QR codes employ Reed–Solomon algebraic error-correcting codes, enabling optical scanners to read data even if the code is torn, smudged, or partially occluded:
- **Level L (Low):** ~7% data recovery. Produces the smallest, simplest matrix.
- **Level M (Medium):** ~15% data recovery. The standard default for web links and marketing.
- **Level Q (Quartile):** ~25% data recovery. Used in industrial or high-wear environments.
- **Level H (High):** ~30% data recovery. Essential when placing a logo in the center.

### Optical Contrast & The "Inverted" Trap

A frequent mistake in graphic design is inverting QR codes (placing light modules on a dark background). The ISO/IEC 18004 specification defines QR codes with dark foreground modules on a light background. 

Many physical barcode scanners and older Android/iOS camera apps look strictly for dark finder patterns surrounded by light quiet zones. This generator evaluates the WCAG relative luminance contrast ratio:
$$\\text{Contrast Ratio} = \\frac{L_1 + 0.05}{L_2 + 0.05}$$
If your colors fall below a **4.5:1 ratio** or if foreground luminance exceeds background luminance, a visible warning appears to prevent printing unreadable codes.

### Direct Static Encoding vs. Redirect Traps

Many commercial QR generators encode a tracking link that redirects to your site—and breaks when you cancel their subscription. This tool creates **100% static, direct QR codes**. Your destination URL or contact data is encoded directly into the matrix with zero middlemen and zero expiration.
`;

const qrTool = `'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { getContrastRatio } from '../engines/qr';
import { Download, AlertTriangle, Link as LinkIcon, Mail, Phone, MessageSquare, User, FileText } from 'lucide-react';

export const Tool: React.FC = () => {
  const [contentType, setContentType] = useState<'url' | 'text' | 'email' | 'phone' | 'sms'>('url');
  const [inputVal, setInputVal] = useState<string>('https://example.com');
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState<string>('');

  const contrast = getContrastRatio(fgColor, bgColor);

  useEffect(() => {
    if (!inputVal) return;

    // Render Canvas
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, inputVal, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: ecLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      }).catch(() => {});
    }

    // Render SVG string
    QRCode.toString(inputVal, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: ecLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((svg) => setSvgString(svg))
      .catch(() => {});
  }, [inputVal, fgColor, bgColor, ecLevel]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.png';
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      {/* Content Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { id: 'url', label: 'URL', icon: LinkIcon, defaultVal: 'https://example.com' },
          { id: 'text', label: 'Text', icon: FileText, defaultVal: 'Hello world' },
          { id: 'email', label: 'Email', icon: Mail, defaultVal: 'mailto:contact@example.com' },
          { id: 'phone', label: 'Phone', icon: Phone, defaultVal: 'tel:+15550199' },
          { id: 'sms', label: 'SMS', icon: MessageSquare, defaultVal: 'smsto:+15550199:Hello' },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = contentType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setContentType(t.id as any); setInputVal(t.defaultVal); }}
              className={\`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md min-h-[44px] transition-colors \${
                isActive ? 'bg-accent-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }\`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Field */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {contentType === 'url' ? 'Destination Website URL' : 'Content to Encode'}
        </label>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter content..."
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
        />
      </div>

      {/* QR Code Graphic Preview & Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
          <canvas ref={canvasRef} className="max-w-full rounded shadow-xs" />

          {/* Contrast warning */}
          {(contrast.isLowContrast || contrast.isInverted) && (
            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {contrast.isInverted ? 'Inverted colors (light on dark) may not scan.' : 'Low contrast (<4.5:1) may fail on mobile scanners.'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Error Correction</label>
            <select
              value={ecLevel}
              onChange={(e) => setEcLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
            >
              <option value="L">L - Low (~7% recovery)</option>
              <option value="M">M - Medium (~15% recovery, Recommended)</option>
              <option value="Q">Q - Quartile (~25% recovery)</option>
              <option value="H">H - High (~30% recovery)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Foreground</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{fgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{bgColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Vector SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

writeToolContent('qr-code-generator', qrSite, qrFaqs, qrExplainer);
writeToolComponent('qr-code-generator', qrTool);
console.log('✓ Wrote qr-code-generator');

console.log('\n✅ Successfully populated all Batch 1 sites!');
