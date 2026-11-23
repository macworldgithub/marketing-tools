import { SiteConfig, FaqsData, LintMessage } from './types';
import { buildContextFromSite, renderLegalTemplate } from './legal-template';
import { FaqItemSchema } from './schemas';

const REQUIRED_SECTIONS = [
  { pattern: /information\s+we\s+collect/i, name: 'Information we collect' },
  { pattern: /how\s+we\s+use\s+information/i, name: 'How we use information' },
  { pattern: /cookies\s+and\s+local\s+storage|cookies|local\s+storage/i, name: 'Cookies and local storage' },
  { pattern: /third\s+parties/i, name: 'Third parties' },
  { pattern: /contact/i, name: 'Contact' },
  { pattern: /changes\s+to\s+this\s+policy|changes/i, name: 'Changes to this policy' },
];

/**
 * Comprehensive linter for Privacy and Terms markdown templates.
 * Enforces Prompt 2 Section 4.4 requirements.
 */
export function lintLegalMarkdown(
  markdown: string,
  site: SiteConfig,
  docType: 'privacy' | 'terms'
): LintMessage[] {
  const messages: LintMessage[] = [];

  // 1. Check for forbidden heading levels (anything other than h2-h3, e.g. # Title or #### Sub)
  // Markdown heading regex: line starting with '#'
  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) {
      const match = line.match(/^(#+)\s+/);
      if (match) {
        const level = match[1].length;
        if (level === 1) {
          messages.push({
            type: 'error',
            rule: 'no-h1-heading',
            message: `Line ${i + 1}: Disallowed h1 heading ("${line.slice(0, 30)}..."). The site sanitizer strips h1 (reserved for page title). Use ## h2 or ### h3 instead.`,
          });
        } else if (level > 3) {
          messages.push({
            type: 'error',
            rule: 'heading-depth',
            message: `Line ${i + 1}: Disallowed h${level} heading. Only h2 and h3 are permitted by the sanitizer schema.`,
          });
        }
      }
    }
  }

  // 2. Strict template rendering check (unknown variables or unbalanced conditionals)
  const context = buildContextFromSite(site);
  let renderedText = '';
  try {
    renderedText = renderLegalTemplate(markdown, context);
  } catch (err: any) {
    messages.push({
      type: 'error',
      rule: 'template-syntax-error',
      message: err.message || 'Template rendering failed due to syntax error.',
    });
    return messages; // Stop further content checks if template syntax is invalid
  }

  // 3. Rendered text length check
  const wordCount = renderedText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) {
    messages.push({
      type: 'warning',
      rule: 'empty-document',
      message: 'Rendered document is empty.',
    });
  } else if (wordCount < 300) {
    messages.push({
      type: 'warning',
      rule: 'short-document',
      message: `Rendered document is short (${wordCount} words; recommended: ≥ 300 words).`,
    });
  }

  // 4. Placeholder TODO checks
  if (/TODO/i.test(renderedText)) {
    messages.push({
      type: 'warning',
      rule: 'unresolved-placeholder',
      message: 'Rendered text contains unresolved "TODO" placeholder.',
    });
  }

  // 5. Required privacy sections check
  if (docType === 'privacy') {
    for (const sec of REQUIRED_SECTIONS) {
      if (!sec.pattern.test(renderedText)) {
        messages.push({
          type: 'warning',
          rule: 'missing-recommended-section',
          message: `Recommended section "${sec.name}" appears to be missing from the rendered privacy policy.`,
        });
      }
    }

    // 6. Conditional clause checks
    // If ads enabled, must contain advertising clause
    if (site.features.ads) {
      const hasAdMention = /advertis|ads|google\s+adsense/i.test(renderedText);
      if (!hasAdMention) {
        messages.push({
          type: 'error',
          rule: 'missing-ads-clause',
          message: 'features.ads is enabled in site.json, but the rendered policy does not contain an advertising disclosure.',
        });
      }
    } else {
      // If ads disabled, warn if advertising cookies mentioned
      if (/advertising\s+cookies|ad\s+network/i.test(renderedText)) {
        messages.push({
          type: 'warning',
          rule: 'unexpected-ads-mention',
          message: 'features.ads is false, but the policy mentions advertising cookies or ad networks.',
        });
      }
    }

    // If analytics enabled, must contain analytics clause
    if (site.features.analytics !== 'none') {
      const hasAnalyticsMention = /analytic/i.test(renderedText);
      if (!hasAnalyticsMention) {
        messages.push({
          type: 'error',
          rule: 'missing-analytics-clause',
          message: `features.analytics is set to "${site.features.analytics}", but the rendered policy does not mention analytics.`,
        });
      }
    }
  }

  return messages;
}

/**
 * Lints an entire FAQs dataset against schema and business rules.
 */
export function lintFaqs(faqs: FaqsData): LintMessage[] {
  const messages: LintMessage[] = [];
  const seenIds = new Set<string>();

  if (faqs.items.length === 0) {
    messages.push({
      type: 'error',
      rule: 'empty-faqs',
      message: 'FAQ list cannot be empty (must contain 1 to 40 items).',
    });
  } else if (faqs.items.length > 40) {
    messages.push({
      type: 'error',
      rule: 'faq-count-limit',
      message: `FAQ count exceeds maximum limit of 40 (currently ${faqs.items.length}).`,
    });
  }

  for (let i = 0; i < faqs.items.length; i++) {
    const item = faqs.items[i];
    const itemPrefix = `Item #${i + 1} (${item.id || 'unnamed'}):`;

    if (!item.id) {
      messages.push({
        type: 'error',
        rule: 'missing-id',
        message: `${itemPrefix} Missing FAQ anchor ID.`,
      });
    } else {
      if (seenIds.has(item.id)) {
        messages.push({
          type: 'error',
          rule: 'duplicate-id',
          message: `${itemPrefix} Duplicate ID "${item.id}". All FAQ IDs must be unique within the file.`,
        });
      }
      seenIds.add(item.id);

      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id)) {
        messages.push({
          type: 'error',
          rule: 'invalid-id-format',
          message: `${itemPrefix} ID must be kebab-case (e.g. "how-it-works").`,
        });
      }
    }

    if (!item.question || item.question.trim().length === 0) {
      messages.push({
        type: 'error',
        rule: 'empty-question',
        message: `${itemPrefix} Question cannot be empty.`,
      });
    } else if (item.question.length > 160) {
      messages.push({
        type: 'error',
        rule: 'question-length',
        message: `${itemPrefix} Question length (${item.question.length} chars) exceeds 160 character limit.`,
      });
    }

    if (!item.answer || item.answer.trim().length === 0) {
      messages.push({
        type: 'error',
        rule: 'empty-answer',
        message: `${itemPrefix} Answer cannot be empty.`,
      });
    } else if (item.answer.length > 2000) {
      messages.push({
        type: 'error',
        rule: 'answer-length',
        message: `${itemPrefix} Answer length (${item.answer.length} chars) exceeds 2000 character limit.`,
      });
    } else if (/<[a-z/][\s\S]*?>/i.test(item.answer)) {
      messages.push({
        type: 'error',
        rule: 'forbidden-html',
        message: `${itemPrefix} Raw HTML is forbidden in FAQ answers. Use standard Markdown instead.`,
      });
    }
  }

  return messages;
}

