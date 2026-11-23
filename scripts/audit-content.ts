import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const SYNC_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'sync.config.json'), 'utf-8'));
const slugs = Object.keys(SYNC_CONFIG);

console.log('=== SECTION F: CONTENT AUDIT ===\n');

// F1: FAQ counts & Explainer word counts
console.log('--- F1: FAQ Counts & Explainer Word Counts ---');
const contentStats: any[] = [];
for (const slug of slugs) {
  const faqsPath = path.join(ROOT_DIR, slug, 'content', 'faqs.json');
  const explainerPath = path.join(ROOT_DIR, slug, 'content', 'explainer.md');
  const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'));
  const explainerText = fs.readFileSync(explainerPath, 'utf-8');
  const wordCount = explainerText.trim().split(/\s+/).filter(Boolean).length;
  contentStats.push({
    slug,
    faqCount: faqs.items.length,
    faqValid: faqs.items.length >= 8 && faqs.items.length <= 12,
    wordCount,
    wordCountValid: wordCount >= 250 && wordCount <= 400,
  });
}
console.table(contentStats);

// F2: Overlapping pairs Jaccard similarity on 5-word shingles
console.log('\n--- F2: Overlapping Pairs 5-Word Shingle Similarity ---');
function get5Shingles(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - 5; i++) {
    shingles.add(words.slice(i, i + 5).join(' '));
  }
  return shingles;
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const s of setA) {
    if (setB.has(s)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const pairs = [
  ['character-counter', 'word-and-character-counter'],
  ['password-generator', 'strong-password-generator'],
  ['loan-calculator', 'emi-calculator'],
  ['qr-code-generator', 'wifi-qr-code-generator'],
];

for (const [a, b] of pairs) {
  const textA =
    fs.readFileSync(path.join(ROOT_DIR, a, 'content', 'explainer.md'), 'utf-8') +
    ' ' +
    fs.readFileSync(path.join(ROOT_DIR, a, 'content', 'faqs.json'), 'utf-8');
  const textB =
    fs.readFileSync(path.join(ROOT_DIR, b, 'content', 'explainer.md'), 'utf-8') +
    ' ' +
    fs.readFileSync(path.join(ROOT_DIR, b, 'content', 'faqs.json'), 'utf-8');

  const score = jaccardSimilarity(get5Shingles(textA), get5Shingles(textB));
  console.log(`Pair [${a}] vs [${b}]: Jaccard 5-shingle similarity = ${score.toFixed(4)} (Threshold: <= 0.35) -> ${score <= 0.35 ? 'PASS' : 'FAIL (NEEDS REWRITE)'}`);
}

// F3: Exact duplicate sentences across all FAQs across sites
console.log('\n--- F3: Cross-Site Duplicate FAQ Sentences Check ---');
const sentenceMap = new Map<string, string[]>();
for (const slug of slugs) {
  const faqs = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, slug, 'content', 'faqs.json'), 'utf-8'));
  for (const item of faqs.items) {
    const fullFaq = item.question + '. ' + item.answer;
    const sentences = fullFaq
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 20); // ignore trivial sentence fragments

    for (const s of sentences) {
      if (!sentenceMap.has(s)) {
        sentenceMap.set(s, []);
      }
      sentenceMap.get(s)!.push(slug);
    }
  }
}

const duplicates: { sentence: string; sites: string[] }[] = [];
for (const [s, siteList] of sentenceMap.entries()) {
  const uniqueSites = [...new Set(siteList)];
  if (uniqueSites.length > 1) {
    duplicates.push({ sentence: s, sites: uniqueSites });
  }
}
console.log(`Total duplicate sentences across different sites: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log('Sample duplicates:', duplicates.slice(0, 5));
}

// F4: Disclaimers on BMI, GPA, Loan, EMI
console.log('\n--- F4: Disclaimers on BMI, GPA, Loan, EMI Sites ---');
const disclaimerSlugs = ['bmi-calculator', 'gpa-calculator', 'loan-calculator', 'emi-calculator'];
for (const slug of disclaimerSlugs) {
  const explainer = fs.readFileSync(path.join(ROOT_DIR, slug, 'content', 'explainer.md'), 'utf-8');
  const faqs = fs.readFileSync(path.join(ROOT_DIR, slug, 'content', 'faqs.json'), 'utf-8');
  const tool = fs.readFileSync(path.join(ROOT_DIR, slug, 'src', 'tool', 'index.tsx'), 'utf-8');
  const combined = (explainer + ' ' + faqs + ' ' + tool).toLowerCase();
  const hasDisclaimer =
    combined.includes('disclaimer') ||
    combined.includes('informational') ||
    combined.includes('educational') ||
    combined.includes('not medical advice') ||
    combined.includes('not financial advice');
  console.log(`Site [${slug}] disclaimer present: ${hasDisclaimer}`);
}

// F6: TODO check
console.log('\n--- F6: TODO Placeholders Check in content/ ---');
let todoViolations = 0;
for (const slug of slugs) {
  const files = ['site.json', 'faqs.json', 'explainer.md', 'privacy.md', 'terms.md'];
  for (const f of files) {
    const p = path.join(ROOT_DIR, slug, 'content', f);
    const content = fs.readFileSync(p, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('TODO')) {
        // Allowed: domain contains TODO-set-domain.com and contactEmail contains TODO@
        if (f === 'site.json' && (line.includes('TODO-set-domain.com') || line.includes('TODO@TODO-set-domain.com'))) {
          continue;
        }
        console.log(`⚠️ Unexpected TODO in ${slug}/content/${f} line ${i + 1}: ${line.trim()}`);
        todoViolations++;
      }
    }
  }
}
console.log(`Total unexpected TODOs: ${todoViolations}`);

