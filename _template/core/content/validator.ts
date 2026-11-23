import fs from 'node:fs';
import path from 'node:path';
import { SiteConfigSchema, FAQsSchema } from './types';
import { buildContextFromSite, renderLegalTemplate } from './legal-template';

export interface ValidationIssue {
  type: 'error' | 'warning';
  file: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateContent(baseDir: string = process.cwd()): ValidationResult {
  const issues: ValidationIssue[] = [];
  const contentDir = path.resolve(baseDir, 'content');

  // 1. Validate site.json
  const sitePath = path.join(contentDir, 'site.json');
  let siteConfig: any = null;
  if (!fs.existsSync(sitePath)) {
    issues.push({ type: 'error', file: 'site.json', message: 'site.json is missing.' });
  } else {
    try {
      const raw = fs.readFileSync(sitePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const result = SiteConfigSchema.safeParse(parsed);
      if (!result.success) {
        issues.push({
          type: 'error',
          file: 'site.json',
          message: `Schema validation failed: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        });
      } else {
        siteConfig = result.data;
        // Check placeholders
        const hasTodoDomain = siteConfig.domain.includes('TODO');
        const hasTodoEmail = siteConfig.contactEmail.includes('TODO');
        const checkPlaceholders = process.env.CHECK_PLACEHOLDERS === '1';

        if (hasTodoDomain) {
          issues.push({
            type: checkPlaceholders ? 'error' : 'warning',
            file: 'site.json',
            message: `domain contains placeholder: "${siteConfig.domain}"`,
          });
        }
        if (hasTodoEmail) {
          issues.push({
            type: checkPlaceholders ? 'error' : 'warning',
            file: 'site.json',
            message: `contactEmail contains placeholder: "${siteConfig.contactEmail}"`,
          });
        }
      }
    } catch (err: any) {
      issues.push({ type: 'error', file: 'site.json', message: `Malformed JSON: ${err.message}` });
    }
  }

  // 2. Validate faqs.json
  const faqsPath = path.join(contentDir, 'faqs.json');
  if (!fs.existsSync(faqsPath)) {
    issues.push({ type: 'error', file: 'faqs.json', message: 'faqs.json is missing.' });
  } else {
    try {
      const raw = fs.readFileSync(faqsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const result = FAQsSchema.safeParse(parsed);
      if (!result.success) {
        issues.push({
          type: 'error',
          file: 'faqs.json',
          message: `Schema validation failed: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        });
      } else {
        const items = result.data.items;
        // Check unique IDs
        const ids = new Set<string>();
        for (const item of items) {
          if (ids.has(item.id)) {
            issues.push({ type: 'error', file: 'faqs.json', message: `Duplicate FAQ id found: "${item.id}"` });
          }
          ids.add(item.id);
        }
        if (items.length < 8) {
          issues.push({
            type: 'warning',
            file: 'faqs.json',
            message: `Recommended 8-12 FAQs for depth; currently contains ${items.length}.`,
          });
        }
      }
    } catch (err: any) {
      issues.push({ type: 'error', file: 'faqs.json', message: `Malformed JSON: ${err.message}` });
    }
  }

  // 3. Validate explainer.md
  const explainerPath = path.join(contentDir, 'explainer.md');
  if (!fs.existsSync(explainerPath)) {
    issues.push({ type: 'error', file: 'explainer.md', message: 'explainer.md is missing.' });
  } else {
    const raw = fs.readFileSync(explainerPath, 'utf-8');
    const wordCount = raw.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 150) {
      issues.push({
        type: 'warning',
        file: 'explainer.md',
        message: `Explainer should be 250-400 words; currently contains ${wordCount} words.`,
      });
    }
  }

  // 4. Validate privacy.md & terms.md templates
  if (siteConfig) {
    const context = buildContextFromSite(siteConfig);
    for (const legalFile of ['privacy.md', 'terms.md']) {
      const filePath = path.join(contentDir, legalFile);
      if (!fs.existsSync(filePath)) {
        issues.push({ type: 'error', file: legalFile, message: `${legalFile} is missing.` });
      } else {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          renderLegalTemplate(raw, context);
        } catch (err: any) {
          issues.push({
            type: 'error',
            file: legalFile,
            message: `Template error in ${legalFile}: ${err.message}`,
          });
        }
      }
    }
  }

  const valid = !issues.some((i) => i.type === 'error');
  return { valid, issues };
}

