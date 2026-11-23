// GENERATED from _template — do not edit here
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { strictSanitizeSchema } from '../utils/sanitize';
import { SiteConfig, SiteConfigSchema, FAQs, FAQsSchema } from './types';
import { buildContextFromSite, renderLegalTemplate } from './legal-template';

export function getContentDir(customBaseDir?: string): string {
  if (customBaseDir) return path.resolve(customBaseDir, 'content');
  return path.resolve(process.cwd(), 'content');
}

export function loadSite(customBaseDir?: string): SiteConfig {
  const filePath = path.join(getContentDir(customBaseDir), 'site.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`site.json not found at: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  return SiteConfigSchema.parse(json);
}

export function loadFaqs(customBaseDir?: string): FAQs {
  const filePath = path.join(getContentDir(customBaseDir), 'faqs.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`faqs.json not found at: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  return FAQsSchema.parse(json);
}

export function loadExplainer(customBaseDir?: string): string {
  const filePath = path.join(getContentDir(customBaseDir), 'explainer.md');
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize, strictSanitizeSchema)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

export async function renderLegal(
  type: 'privacy' | 'terms',
  customBaseDir?: string
): Promise<{ title: string; html: string; rawMarkdown: string }> {
  const site = loadSite(customBaseDir);
  const fileName = `${type}.md`;
  const filePath = path.join(getContentDir(customBaseDir), fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`${fileName} not found at: ${filePath}`);
  }

  const rawTemplate = fs.readFileSync(filePath, 'utf-8');
  const context = buildContextFromSite(site);
  const populatedMarkdown = renderLegalTemplate(rawTemplate, context);
  const html = await markdownToHtml(populatedMarkdown);

  const title = type === 'privacy' ? `Privacy Policy - ${site.siteName}` : `Terms of Service - ${site.siteName}`;
  return { title, html, rawMarkdown: populatedMarkdown };
}

