import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubStore } from './github-store';
import { ConnectionConfig } from './types';

describe('GitHubStore API & Atomic Commit Flow', () => {
  const config: ConnectionConfig = {
    owner: 'test-owner',
    repo: 'test-repo',
    branch: 'main',
    token: 'test-token',
    saveMode: 'commit',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('translates 401 error into clear actionable message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Bad credentials' }),
      text: async () => 'Bad credentials',
    } as any);

    const store = new GitHubStore(config);
    await expect(store.testConnection()).resolves.toEqual({
      ok: false,
      error: expect.stringContaining('Invalid or expired GitHub token'),
      siteCount: 0,
    });
  });

  it('translates 403 rate limit and permissions into clear messages', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ 'x-ratelimit-remaining': '0' }),
      json: async () => ({ message: 'API rate limit exceeded' }),
      text: async () => 'API rate limit exceeded',
    } as any);

    const store = new GitHubStore(config);
    await expect(store.testConnection()).resolves.toEqual({
      ok: false,
      error: expect.stringContaining('rate limit exceeded'),
      siteCount: 0,
    });
  });

  it('translates 404 repository not found into clear message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not Found' }),
      text: async () => 'Not Found',
    } as any);

    const store = new GitHubStore(config);
    await expect(store.testConnection()).resolves.toEqual({
      ok: false,
      error: expect.stringContaining('Resource not found on GitHub'),
      siteCount: 0,
    });
  });

  it('discovers sites using the Git Trees API', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        sha: 'tree-sha-123',
        tree: [
          { path: 'bmi-calculator/content/site.json', mode: '100644', type: 'blob', sha: 'sha-1' },
          { path: 'age-calculator/content/site.json', mode: '100644', type: 'blob', sha: 'sha-2' },
          { path: '_template/project/content/site.json', mode: '100644', type: 'blob', sha: 'sha-ignore' },
          { path: 'scripts/content/site.json', mode: '100644', type: 'blob', sha: 'sha-ignore' },
          { path: 'bmi-calculator/content/faqs.json', mode: '100644', type: 'blob', sha: 'sha-faqs' },
        ],
      }),
    } as any);

    const store = new GitHubStore(config);
    const sites = await store.listSites();
    expect(sites).toEqual(['age-calculator', 'bmi-calculator']);
  });

  it('executes atomic commit batch using Git Data API', async () => {
    const fetchMock = vi.spyOn(global, 'fetch');

    // 1. GET /git/ref/heads/main
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ object: { sha: 'base-commit-sha-1' } }),
    } as any);

    // 2. POST /git/blobs
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ sha: 'new-blob-sha-1' }),
    } as any);

    // 3. GET /git/commits/base-commit-sha-1
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ tree: { sha: 'base-tree-sha-1' } }),
    } as any);

    // 4. POST /git/trees
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ sha: 'new-tree-sha-1' }),
    } as any);

    // 5. POST /git/commits
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        sha: 'new-commit-sha-1',
        html_url: 'https://github.com/test-owner/test-repo/commit/new-commit-sha-1',
      }),
    } as any);

    // 6. PATCH /git/refs/heads/main
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as any);

    const store = new GitHubStore(config);
    const result = await store.commitBatch(
      [
        {
          path: 'bmi-calculator/content/faqs.json',
          content: '{"schemaVersion":1,"items":[]}',
        },
      ],
      'content: update bmi faqs'
    );

    expect(result.success).toBe(true);
    expect(result.commitSha).toBe('new-commit-sha-1');
    expect(result.commitUrl).toContain('new-commit-sha-1');

    // Verify 6 Git API calls executed in exact order
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(fetchMock.mock.calls[0][0]).toContain('/git/ref/heads/main');
    expect(fetchMock.mock.calls[1][0]).toContain('/git/blobs');
    expect(fetchMock.mock.calls[2][0]).toContain('/git/commits/base-commit-sha-1');
    expect(fetchMock.mock.calls[3][0]).toContain('/git/trees');
    expect(fetchMock.mock.calls[4][0]).toContain('/git/commits');
    expect(fetchMock.mock.calls[5][0]).toContain('/git/refs/heads/main');
  });
});

