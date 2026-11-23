import {
  ContentStore,
  ConnectionConfig,
  FileChange,
  CommitResult,
  CommitHistoryItem,
  DeployStatus,
} from './types';
import { SiteContent, MasterBaselines } from '../content/types';
import { SiteSchema, FaqsSchema } from '../content/schemas';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
}

export class GitHubStore implements ContentStore {
  private config: ConnectionConfig;
  private treeCache: Map<string, string> = new Map(); // path -> sha
  private baseCommitSha: string | null = null;
  private baseTreeSha: string | null = null;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('https://')
      ? endpoint
      : `https://api.github.com${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${this.config.token}`,
      ...(options.headers as Record<string, string>),
    };

    let res: Response;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (err: any) {
      throw new Error(`Network error contacting GitHub API: ${err.message || String(err)}`);
    }

    if (!res.ok) {
      let errorBody = '';
      try {
        const json = await res.json();
        errorBody = json.message || JSON.stringify(json);
      } catch {
        errorBody = await res.text();
      }

      if (res.status === 401) {
        throw new Error('Invalid or expired GitHub token. Please verify your Personal Access Token in Settings.');
      } else if (res.status === 403) {
        if (res.headers.get('x-ratelimit-remaining') === '0') {
          throw new Error('GitHub API rate limit exceeded. Please wait or use an authenticated fine-grained token.');
        }
        throw new Error(`Permission denied: ${errorBody}. Verify token has "Contents: Read and write" on ${this.config.owner}/${this.config.repo}.`);
      } else if (res.status === 404) {
        throw new Error(`Resource not found on GitHub: ${this.config.owner}/${this.config.repo} (branch: ${this.config.branch}).`);
      } else if (res.status === 409 || res.status === 422) {
        throw new Error(`Git conflict or validation error (${res.status}): ${errorBody}`);
      }

      throw new Error(`GitHub API Error (${res.status}): ${errorBody}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  async testConnection(): Promise<{ ok: boolean; error?: string; siteCount: number }> {
    try {
      // 1. Check repo and write permissions
      const repoData = await this.request(`/repos/${this.config.owner}/${this.config.repo}`);
      if (!repoData.permissions?.push && !repoData.permissions?.admin) {
        return {
          ok: false,
          error: `Token does not have push (write) permissions to ${this.config.owner}/${this.config.repo}.`,
          siteCount: 0,
        };
      }

      // 2. Discover sites
      const sites = await this.listSites();
      if (sites.length === 0) {
        return {
          ok: false,
          error: `Repository connected, but no site folders matching "<slug>/content/site.json" were found on branch "${this.config.branch}".`,
          siteCount: 0,
        };
      }

      return { ok: true, siteCount: sites.length };
    } catch (err: any) {
      return { ok: false, error: err.message || String(err), siteCount: 0 };
    }
  }

  async listSites(): Promise<string[]> {
    const treeData = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/git/trees/${encodeURIComponent(this.config.branch)}?recursive=1`
    );

    this.baseTreeSha = treeData.sha;
    this.treeCache.clear();

    const slugs = new Set<string>();
    for (const item of (treeData.tree || []) as GitHubTreeItem[]) {
      this.treeCache.set(item.path, item.sha);
      const match = item.path.match(/^([a-z0-9-]+)\/content\/site\.json$/);
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
    let sha = this.treeCache.get(path);
    if (!sha) {
      // Refresh tree if not in cache
      await this.listSites();
      sha = this.treeCache.get(path);
    }

    if (!sha) {
      throw new Error(`File "${path}" does not exist in branch "${this.config.branch}".`);
    }

    const blob = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/git/blobs/${sha}`
    );

    if (blob.encoding === 'base64') {
      const bin = atob(blob.content.replace(/\s/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }

    return blob.content;
  }

  async readBaselines(): Promise<MasterBaselines> {
    const privacy = await this.readFile('_shared/privacy.master.md').catch(() => '');
    const terms = await this.readFile('_shared/terms.master.md').catch(() => '');
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
    if (changes.length === 0) {
      throw new Error('Cannot commit empty batch of changes.');
    }

    // 1. Get branch ref & latest commit
    const refData = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${encodeURIComponent(this.config.branch)}`
    );
    const headCommitSha = refData.object.sha;

    // 2. Conflict safety: if head moved from our initial baseCommitSha
    let rebased = false;
    if (this.baseCommitSha && headCommitSha !== this.baseCommitSha) {
      // Refresh tree to inspect latest blob SHAs
      await this.listSites();
      for (const change of changes) {
        const latestSha = this.treeCache.get(change.path);
        if (change.originalSha && latestSha && latestSha !== change.originalSha) {
          // Real conflict: the remote file was modified while user was editing
          const theirs = await this.readFile(change.path);
          return {
            success: false,
            commitSha: '',
            rebased: false,
            conflict: {
              path: change.path,
              theirs,
              yours: change.content,
              base: change.originalSha,
            },
          };
        }
      }
      rebased = true;
    }

    // 3. Create Git Blobs
    const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
    for (const change of changes) {
      const blobRes = await this.request(
        `/repos/${this.config.owner}/${this.config.repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: change.content,
            encoding: 'utf-8',
          }),
        }
      );
      treeItems.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: blobRes.sha,
      });
    }

    // 4. Create new Git Tree on top of latest tree
    const commitData = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/git/commits/${headCommitSha}`
    );
    const currentTreeSha = commitData.tree.sha;

    const newTreeRes = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: currentTreeSha,
          tree: treeItems,
        }),
      }
    );

    // 5. Create Git Commit (strictly without AI/co-author trailers)
    const cleanMessage = message.trim();
    const newCommitRes = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message: cleanMessage,
          tree: newTreeRes.sha,
          parents: [headCommitSha],
        }),
      }
    );
    const newCommitSha = newCommitRes.sha;

    // 6. Update Ref or Open PR
    if (this.config.saveMode === 'pr') {
      const prBranchName = `content/admin-${Date.now()}`;
      // Create new branch
      await this.request(
        `/repos/${this.config.owner}/${this.config.repo}/git/refs`,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: `refs/heads/${prBranchName}`,
            sha: newCommitSha,
          }),
        }
      );

      // Create PR
      const prRes = await this.request(
        `/repos/${this.config.owner}/${this.config.repo}/pulls`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: cleanMessage,
            head: prBranchName,
            base: this.config.branch,
            body: `Content updates created via Sites Admin.\n\nAffected files:\n${changes.map((c) => `- \`${c.path}\``).join('\n')}`,
          }),
        }
      );

      this.baseCommitSha = newCommitSha;
      return {
        success: true,
        commitSha: newCommitSha,
        commitUrl: newCommitRes.html_url,
        pullRequestUrl: prRes.html_url,
        rebased,
      };
    } else {
      // Fast-forward update branch ref non-force
      await this.request(
        `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${encodeURIComponent(this.config.branch)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            sha: newCommitSha,
            force: false,
          }),
        }
      );

      this.baseCommitSha = newCommitSha;
      return {
        success: true,
        commitSha: newCommitSha,
        commitUrl: `https://github.com/${this.config.owner}/${this.config.repo}/commit/${newCommitSha}`,
        rebased,
      };
    }
  }

  async history(path: string): Promise<CommitHistoryItem[]> {
    const commits = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(this.config.branch)}&per_page=10`
    );

    return (commits || []).map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name || c.author?.login || 'Unknown',
      date: c.commit.author?.date || new Date().toISOString(),
    }));
  }

  async restore(path: string, commitSha: string): Promise<string> {
    const fileData = await this.request(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(commitSha)}`
    );

    if (fileData.encoding === 'base64') {
      const bin = atob(fileData.content.replace(/\s/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return fileData.content;
  }

  async getDeployStatus(commitSha: string): Promise<DeployStatus> {
    try {
      const status = await this.request(
        `/repos/${this.config.owner}/${this.config.repo}/commits/${commitSha}/status`
      );

      if (status.state === 'success') {
        return { state: 'success', description: status.description || 'All checks passed.' };
      } else if (status.state === 'pending') {
        return { state: 'pending', description: 'Deployment or checks in progress...' };
      } else if (status.state === 'failure') {
        return { state: 'failure', description: status.description || 'Checks or build failed.' };
      }
      return { state: 'unknown', description: 'Committed — your host will rebuild affected sites.' };
    } catch {
      return { state: 'unknown', description: 'Committed — your host will rebuild affected sites.' };
    }
  }
}

