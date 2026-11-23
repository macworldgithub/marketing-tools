import { z } from 'zod';
import { SiteConfig, FaqsData } from '../content/types';

export const PreviewPageTypeSchema = z.enum(['home', 'faqs', 'privacy', 'terms']);
export type PreviewPageType = z.infer<typeof PreviewPageTypeSchema>;

export const PreviewThemeMessageSchema = z.object({
  v: z.literal(1),
  type: z.literal('preview-theme'),
  theme: z.enum(['light', 'dark']),
});
export type PreviewThemeMessage = z.infer<typeof PreviewThemeMessageSchema>;

export const PreviewContentMessageSchema = z.object({
  v: z.literal(1),
  type: z.literal('preview-content'),
  page: PreviewPageTypeSchema,
  site: z.any(), // SiteConfig draft
  faqs: z.any(), // FaqsData draft
  legalMarkdown: z.string().nullable().optional(),
  focusId: z.string().optional(),
  changedIds: z.array(z.string()).optional(),
  changedParagraphs: z.array(z.string()).optional(),
});
export type PreviewContentMessage = z.infer<typeof PreviewContentMessageSchema>;

export const PreviewReadyMessageSchema = z.object({
  v: z.literal(1),
  type: z.literal('preview-ready'),
  slug: z.string(),
});
export type PreviewReadyMessage = z.infer<typeof PreviewReadyMessageSchema>;

export const PreviewRenderedMessageSchema = z.object({
  v: z.literal(1),
  type: z.literal('preview-rendered'),
  ok: z.boolean(),
  errors: z.array(z.string()).optional(),
  contentHeight: z.number().optional(),
});
export type PreviewRenderedMessage = z.infer<typeof PreviewRenderedMessageSchema>;

