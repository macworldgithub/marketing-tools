import { SiteContent, MasterBaselines } from '../content/types';

export interface ConnectionConfig {
  owner: string;
  repo: string;
  branch: string; // default 'main'
  token: string;  // fine-grained personal access token
  saveMode: 'commit' | 'pr'; // default 'commit'
}

export interface FileChange {
  path: string; // e.g. "bmi-calculator/content/faqs.json"
  content: string; // updated content
  originalSha?: string; // base blob sha if known
}

export interface CommitResult {
  success: boolean;
  commitSha: string;
  commitUrl?: string;
  pullRequestUrl?: string;
  rebased?: boolean;
  conflict?: {
    path: string;
    theirs: string;
    yours: string;
    base: string;
  };
}

export interface CommitHistoryItem {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface DeployStatus {
  state: 'pending' | 'success' | 'failure' | 'unknown';
  description?: string;
  targetUrl?: string;
}

export interface ContentStore {
  /**
   * Tests connection, validates write permissions, and finds all site content directories.
   */
  testConnection(): Promise<{ ok: boolean; error?: string; siteCount: number }>;

  /**
   * Discovers all site slugs by finding `<slug>/content/site.json` in the tree.
   * Ignores directories starting with `_`, `scripts`, `.`, and `sites-admin`.
   */
  listSites(): Promise<string[]>;

  /**
   * Reads raw file content as text.
   */
  readFile(path: string): Promise<string>;

  /**
   * Loads all content for a single site (site.json, faqs.json, privacy.md, terms.md, explainer.md).
   */
  readSiteContent(slug: string, baselines?: MasterBaselines): Promise<SiteContent>;

  /**
   * Reads the master baseline files from `_shared/`.
   */
  readBaselines(): Promise<MasterBaselines>;

  /**
   * Commits a batch of file changes atomically using the Git Data API.
   */
  commitBatch(changes: FileChange[], message: string): Promise<CommitResult>;

  /**
   * Lists commit history touching a specific path.
   */
  history(path: string): Promise<CommitHistoryItem[]>;

  /**
   * Restores historical content for a file at a specific commit SHA.
   */
  restore(path: string, commitSha: string): Promise<string>;

  /**
   * Fetches the commit check status or deployment status.
   */
  getDeployStatus(commitSha: string): Promise<DeployStatus>;
}

