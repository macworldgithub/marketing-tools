import {
  ContentStore,
  FileChange,
  CommitResult,
  CommitHistoryItem,
  DeployStatus,
} from './types';
import { SiteContent, MasterBaselines } from '../content/types';
import { SiteSchema, FaqsSchema } from '../content/schemas';

import { DEFAULT_MOCK_FILES } from './default-fixtures';

export class MockStore implements ContentStore {
  private files: Map<string, string> = new Map();
  private commitHistory: Map<string, CommitHistoryItem[]> = new Map();
  private baseCommitSha = 'mock-initial-commit-sha';

  constructor(initialFiles?: Record<string, string>) {
    const source = initialFiles !== undefined ? initialFiles : DEFAULT_MOCK_FILES;
    for (const [p, c] of Object.entries(source)) {
      this.files.set(p, c);
    }
  }

  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  async testConnection(): Promise<{ ok: boolean; error?: string; siteCount: number }> {
    const sites = await this.listSites();
    return { ok: true, siteCount: sites.length };
  }

  async listSites(): Promise<string[]> {
    const slugs = new Set<string>();
    for (const path of this.files.keys()) {
      const match = path.match(/^([a-z0-9-]+)\/content\/site\.json$/);
      if (match) {
        const slug = match[1];
        if (!slug.startsWith('_') && slug !== 'scripts' && slug !== 'sites-admin') {
          slugs.add(slug);
        }
      }
    }
    return Array.from(slugs).sort();
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async readBaselines(): Promise<MasterBaselines> {
    const privacy = this.files.get('_shared/privacy.master.md') || '';
    const terms = this.files.get('_shared/terms.master.md') || '';
    return {
      privacyMasterMd: privacy,
      termsMasterMd: terms,
    };
  }

  async readSiteContent(slug: string, baselines?: MasterBaselines): Promise<SiteContent> {
    const siteRaw = await this.readFile(`${slug}/content/site.json`);
    const faqsRaw = await this.readFile(`${slug}/content/faqs.json`);
    const privacyMd = await this.readFile(`${slug}/content/privacy.md`);
    const termsMd = await this.readFile(`${slug}/content/terms.md`);
    let explainerMd = '';
    try {
      explainerMd = await this.readFile(`${slug}/content/explainer.md`);
    } catch {}

    const site = SiteSchema.parse(JSON.parse(siteRaw));
    const faqs = FaqsSchema.parse(JSON.parse(faqsRaw));

    const bl = baselines || (await this.readBaselines());
    const isCustomPrivacy = privacyMd.trim() !== bl.privacyMasterMd.trim();
    const isCustomTerms = termsMd.trim() !== bl.termsMasterMd.trim();

    return {
      slug,
      site,
      faqs,
      explainerMd,
      privacyMd,
      termsMd,
      isCustomPrivacy,
      isCustomTerms,
    };
  }

  async commitBatch(changes: FileChange[], message: string): Promise<CommitResult> {
    const newSha = 'mock-commit-' + Date.now();
    for (const change of changes) {
      this.files.set(change.path, change.content);
      const historyList = this.commitHistory.get(change.path) || [];
      historyList.unshift({
        sha: newSha,
        message,
        author: 'Sites Admin Mock',
        date: new Date().toISOString(),
      });
      this.commitHistory.set(change.path, historyList);
    }
    this.baseCommitSha = newSha;
    return {
      success: true,
      commitSha: newSha,
      commitUrl: `https://github.com/mock-owner/mock-repo/commit/${newSha}`,
    };
  }

  async history(path: string): Promise<CommitHistoryItem[]> {
    return this.commitHistory.get(path) || [
      {
        sha: this.baseCommitSha,
        message: 'Initial content commit',
        author: 'Admin',
        date: new Date().toISOString(),
      },
    ];
  }

  async restore(path: string, _commitSha: string): Promise<string> {
    return this.readFile(path);
  }

  async getDeployStatus(_commitSha: string): Promise<DeployStatus> {
    return {
      state: 'success',
      description: 'Mock deployment successful.',
      targetUrl: 'http://localhost:3000',
    };
  }
}

