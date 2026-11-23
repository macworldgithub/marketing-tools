import { z } from 'zod';

export type AccentColor = 'blue' | 'teal' | 'indigo' | 'emerald' | 'slate';
export type AnalyticsProvider = 'none' | 'plausible' | 'ga4';

export interface SiteFeatures {
  ads: boolean;
  analytics: AnalyticsProvider;
  localStorageKeys: string[];
}

export interface SiteConfig {
  schemaVersion: number;
  slug: string;
  siteName: string;
  toolName: string;
  primaryKeyword: string;
  domain: string;
  tagline: string;
  contactEmail: string;
  accent: AccentColor;
  effectiveDate: string; // YYYY-MM-DD
  features: SiteFeatures;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqsData {
  schemaVersion: number;
  items: FaqItem[];
}

export interface SiteContent {
  slug: string;
  site: SiteConfig;
  faqs: FaqsData;
  explainerMd: string;
  privacyMd: string;
  termsMd: string;
  isCustomPrivacy: boolean;
  isCustomTerms: boolean;
}

export interface MasterBaselines {
  privacyMasterMd: string;
  termsMasterMd: string;
}

export interface LintMessage {
  type: 'error' | 'warning';
  rule: string;
  message: string;
  source?: 'admin-linter' | 'production-renderer';
  field?: string;
}

