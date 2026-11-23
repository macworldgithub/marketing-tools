// GENERATED from _template — do not edit here
import { z } from 'zod';
import { SiteConfigSchema, FAQsSchema } from '../content/types';

export const PreviewContentMessageSchema = z.object({
  v: z.literal(1),
  type: z.literal('preview-content'),
  page: z.enum(['home', 'faqs', 'privacy', 'terms']),
  site: SiteConfigSchema,
  faqs: FAQsSchema,
  legalMarkdown: z.string().nullable().optional(),
  focusId: z.string().optional(),
});
export type PreviewContentMessage = z.infer<typeof PreviewContentMessageSchema>;

export const PreviewThemeMessageSchema = z.object({
  v: z.literal(1),
  type: z.literal('preview-theme'),
  theme: z.enum(['light', 'dark']),
});
export type PreviewThemeMessage = z.infer<typeof PreviewThemeMessageSchema>;

export interface PreviewReadyMessage {
  v: 1;
  type: 'preview-ready';
  slug: string;
}

export interface PreviewRenderedMessage {
  v: 1;
  type: 'preview-rendered';
  ok: boolean;
  errors: string[];
  contentHeight: number;
}

