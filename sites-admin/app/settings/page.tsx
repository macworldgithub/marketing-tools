'use client';

import React, { useState, useEffect } from 'react';
import { ConnectionConfig } from '../../src/lib/store/types';
import {
  setInMemoryConfig,
  getInMemoryConfig,
  saveToVault,
  loadFromVault,
  hasSavedVault,
  clearVault,
} from '../../src/lib/store/vault';
import { createStoreFromConfig, getActiveStore, setActiveStore, MockStore } from '../../src/lib/store';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCw,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import * as fflate from 'fflate';

export default function SettingsPage() {
  const [owner, setOwner] = useState<string>('macworldgithub');
  const [repo, setRepo] = useState<string>('marketing-tools');
  const [branch, setBranch] = useState<string>('main');
  const [token, setToken] = useState<string>('');
  const [saveMode, setSaveMode] = useState<'commit' | 'pr'>('commit');

  const [rememberDevice, setRememberDevice] = useState<boolean>(false);
  const [passphrase, setPassphrase] = useState<string>('');
  const [hasEncryptedRecord, setHasEncryptedRecord] = useState<boolean>(false);
  const [unlockPassphrase, setUnlockPassphrase] = useState<string>('');

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Load existing configuration or check saved vault
  useEffect(() => {
    const mem = getInMemoryConfig();
    if (mem) {
      setOwner(mem.owner);
      setRepo(mem.repo);
      setBranch(mem.branch);
      setToken(mem.token);
      setSaveMode(mem.saveMode || 'commit');
    }

    hasSavedVault().then((saved) => {
      setHasEncryptedRecord(saved);
      if (saved) setRememberDevice(true);
    });
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const config: ConnectionConfig = {
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      token: token.trim(),
      saveMode,
    };

    setInMemoryConfig(config);
    const store = createStoreFromConfig(config);

    try {
      const res = await store.testConnection();
      if (res.ok) {
        setTestResult({
          ok: true,
          message: `Successfully connected to ${config.owner}/${config.repo}! Found ${res.siteCount} tool sites.`,
        });

        if (rememberDevice && passphrase) {
          await saveToVault(config.token, passphrase, {
            owner: config.owner,
            repo: config.repo,
            branch: config.branch,
            saveMode: config.saveMode,
          });
          setHasEncryptedRecord(true);
        }
      } else {
        setTestResult({
          ok: false,
          message: res.error || 'Connection failed.',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Connection test encountered an error.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleUnlockSaved = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const config = await loadFromVault(unlockPassphrase);
      if (config) {
        setOwner(config.owner);
        setRepo(config.repo);
        setBranch(config.branch);
        setToken(config.token);
        setSaveMode(config.saveMode);

        const store = createStoreFromConfig(config);
        const res = await store.testConnection();
        if (res.ok) {
          setTestResult({
            ok: true,
            message: `Vault unlocked! Connected to ${config.owner}/${config.repo} (${res.siteCount} sites).`,
          });
        }
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Failed to unlock vault.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    await clearVault();
    setToken('');
    setPassphrase('');
    setUnlockPassphrase('');
    setHasEncryptedRecord(false);
    setTestResult(null);
    setActiveStore(null);
  };

  const handleUseMockMode = () => {
    localStorage.setItem('use_mock_store', 'true');
    const store = new MockStore();
    setActiveStore(store);
    setTestResult({
      ok: true,
      message: 'Demo / Mock Store activated! You can now explore the admin interface offline.',
    });
  };

  const handleExportBackup = async () => {
    const store = getActiveStore();
    if (!store) {
      alert('Please connect to a repository first.');
      return;
    }

    try {
      const sites = await store.listSites();
      const zipData: Record<string, Uint8Array> = {};
      const enc = new TextEncoder();

      // Baselines
      const bl = await store.readBaselines();
      zipData['_shared/privacy.master.md'] = enc.encode(bl.privacyMasterMd);
      zipData['_shared/terms.master.md'] = enc.encode(bl.termsMasterMd);

      // Sites
      for (const slug of sites) {
        for (const file of ['site.json', 'faqs.json', 'privacy.md', 'terms.md', 'explainer.md']) {
          try {
            const content = await store.readFile(`${slug}/content/${file}`);
            zipData[`${slug}/content/${file}`] = enc.encode(content);
          } catch {}
        }
      }

      const zipped = fflate.zipSync(zipData);
      const blob = new Blob([zipped as any], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tools-content-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Backup failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & GitHub Connection</h1>
        <p className="text-xs text-slate-500 mt-1">
          Sites Admin connects directly to your tools repository via the GitHub REST API without an intermediary server.
        </p>
      </div>

      {/* Unlock existing vault card */}
      {hasEncryptedRecord && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Encrypted Token Found On This Device</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Enter your passphrase to unlock your credentials without entering your GitHub token again.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={unlockPassphrase}
              onChange={(e) => setUnlockPassphrase(e.target.value)}
              placeholder="Vault Passphrase..."
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleUnlockSaved}
              disabled={testing || !unlockPassphrase}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold"
            >
              {testing ? 'Unlocking…' : 'Unlock & Connect'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
              title="Delete stored credentials"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Connection form */}
      <form onSubmit={handleConnect} className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">GitHub Owner / Org</label>
            <input
              type="text"
              required
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. macworldgithub"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Repository Name</label>
            <input
              type="text"
              required
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="e.g. marketing-tools"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch</label>
          <input
            type="text"
            required
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Personal Access Token (fine-grained)
            </label>
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
            >
              Generate token <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <input
            type="password"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_..."
            className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400">
            Permissions required: <em>Contents: Read and write</em>. (Optional: <em>Pull requests: Read and write</em>).
          </p>
        </div>

        {/* Save mode */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Save Mode</label>
          <div className="flex items-center space-x-6 text-xs text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                value="commit"
                checked={saveMode === 'commit'}
                onChange={() => setSaveMode('commit')}
                className="text-blue-600"
              />
              <span>Commit directly to branch (solo mode)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                value="pr"
                checked={saveMode === 'pr'}
                onChange={() => setSaveMode('pr')}
                className="text-blue-600"
              />
              <span>Open Pull Request (branch: content/admin-*)</span>
            </label>
          </div>
        </div>

        {/* Remember on device */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="font-medium">Remember on this device (AES-GCM encrypted in IndexedDB)</span>
          </label>

          {rememberDevice && (
            <div className="pl-6 space-y-1">
              <label className="text-[11px] text-slate-500">Vault Passphrase (PBKDF2 600,000 iterations)</label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Passphrase to encrypt your token..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={testing || !token}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            {testing ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
            <span>{testing ? 'Testing Connection…' : 'Save & Connect'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseMockMode}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Use Demo / Mock Store
          </button>
        </div>
      </form>

      {/* Backup and export */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white">Export Content Backup</h2>
          <p className="text-[11px] text-slate-500">
            Download a ZIP containing every site&apos;s content folder and master baselines.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportBackup}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export ZIP</span>
        </button>
      </div>
    </div>
  );
}

