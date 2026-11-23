'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getActiveStore, MockStore } from '../src/lib/store';
import { getSitesWithPendingChanges } from '../src/lib/store/pending';
import { SiteContent, MasterBaselines } from '../src/lib/content/types';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Layers,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  HelpCircle,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<SiteContent[]>([]);
  const [pendingSites, setPendingSites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCustomOnly, setFilterCustomOnly] = useState<boolean>(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    let store = getActiveStore();

    if (!store) {
      // In development or if not connected, attempt fallback to local MockStore
      store = new MockStore();
    }

    try {
      const slugs = await store.listSites();
      if (slugs.length === 0) {
        // Not connected or empty repo
        setLoading(false);
        return;
      }

      const baselines: MasterBaselines = await store.readBaselines();
      const contentList = await Promise.all(
        slugs.map((s) => store!.readSiteContent(s, baselines).catch(() => null))
      );
      setSites(contentList.filter(Boolean) as SiteContent[]);

      const pending = await getSitesWithPendingChanges();
      setPendingSites(new Set(pending));
    } catch (err: any) {
      setError(err.message || 'Failed to load sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and searched sites
  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      const matchesSearch =
        s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.site.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.site.domain.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCustom = filterCustomOnly
        ? s.isCustomPrivacy || s.isCustomTerms
        : true;

      return matchesSearch && matchesCustom;
    });
  }, [sites, searchQuery, filterCustomOnly]);

  const toggleSelectAll = () => {
    if (selectedSlugs.length === filteredSites.length) {
      setSelectedSlugs([]);
    } else {
      setSelectedSlugs(filteredSites.map((s) => s.slug));
    }
  };

  const toggleSelectSlug = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
    } else {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
  };

  if (!loading && sites.length === 0 && !error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Connect Your Tools Repository</h2>
        <p className="text-xs text-slate-500">
          Sites Admin needs a GitHub fine-grained personal access token to read and manage the content folders of your 23 tool websites.
        </p>
        <div className="pt-2">
          <Link
            href="/settings/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <span>Open Connection Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tool Sites Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            {sites.length} total standalone websites discovered in repository tree
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedSlugs.length > 0 && (
            <Link
              href={`/bulk/?sites=${selectedSlugs.join(',')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bulk Actions ({selectedSlugs.length})</span>
            </Link>
          )}

          <button
            type="button"
            onClick={loadData}
            title="Refresh repository content"
            className="p-2 sm:p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by slug, site name, or domain..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs">
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterCustomOnly}
              onChange={(e) => setFilterCustomOnly(e.target.checked)}
              className="rounded text-blue-600 w-4 h-4"
            />
            <span className="text-[11px] sm:text-xs">Customised only</span>
          </label>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500 font-medium text-[11px] sm:text-xs">{filteredSites.length} sites</span>
        </div>
      </div>

      {/* Select All on Mobile bar */}
      <div className="md:hidden flex items-center justify-between px-1 text-xs text-slate-600 dark:text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={selectedSlugs.length > 0 && selectedSlugs.length === filteredSites.length}
            onChange={toggleSelectAll}
            className="rounded text-blue-600 w-4 h-4"
          />
          <span>Select all {filteredSites.length} sites</span>
        </label>
        {selectedSlugs.length > 0 && (
          <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedSlugs.length} selected</span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MOBILE CARD VIEW (Phones < 768px) */}
      <div className="block md:hidden space-y-3">
        {filteredSites.map((item) => {
          const isSelected = selectedSlugs.includes(item.slug);
          const hasPending = pendingSites.has(item.slug);
          const hasPlaceholder =
            item.site.domain.includes('TODO') || item.site.contactEmail.includes('TODO');

          return (
            <div
              key={item.slug}
              className={`p-3.5 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectSlug(item.slug)}
                    className="mt-1 rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <Link
                      href={`/site/?slug=${item.slug}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.site.siteName}
                    </Link>
                    <div className="text-[11px] font-mono text-slate-400">{item.slug}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {hasPending && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Unsaved
                    </span>
                  )}
                  {(item.isCustomPrivacy || item.isCustomTerms) && (
                    <span className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              {/* Domain & Meta */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                  <span>{item.site.domain}</span>
                  {hasPlaceholder && (
                    <span title="Placeholder detected">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    {item.faqs.items.length} FAQs
                  </span>
                </div>
              </div>

              {/* Features & Action Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  {item.site.features.ads && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      Ads
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.site.features.analytics}
                  </span>
                  <span className="font-mono text-slate-400">{item.site.effectiveDate}</span>
                </div>

                <Link
                  href={`/site/?slug=${item.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors"
                >
                  <span>Edit</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP / TABLET TABLE VIEW (≥ 768px) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedSlugs.length > 0 && selectedSlugs.length === filteredSites.length}
                  onChange={toggleSelectAll}
                  className="rounded text-blue-600 w-4 h-4"
                />
              </th>
              <th className="py-2.5 px-3">Site / Tool Name</th>
              <th className="py-2.5 px-3">Domain</th>
              <th className="py-2.5 px-3 text-center">FAQs</th>
              <th className="py-2.5 px-3">Privacy Policy</th>
              <th className="py-2.5 px-3">Terms of Service</th>
              <th className="py-2.5 px-3">Features</th>
              <th className="py-2.5 px-3">Effective Date</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {filteredSites.map((item) => {
              const isSelected = selectedSlugs.includes(item.slug);
              const hasPending = pendingSites.has(item.slug);
              const hasPlaceholder =
                item.site.domain.includes('TODO') || item.site.contactEmail.includes('TODO');

              return (
                <tr
                  key={item.slug}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectSlug(item.slug)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                  </td>

                  {/* Slug & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/site/?slug=${item.slug}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                      >
                        {item.site.siteName}
                      </Link>
                      {hasPending && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.slug}</div>
                  </td>

                  {/* Domain */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {item.site.domain}
                      </span>
                      {hasPlaceholder && (
                        <span
                          title="Placeholder domain or email detected"
                          className="text-amber-500 dark:text-amber-400"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* FAQ count */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.faqs.items.length}
                    </span>
                  </td>

                  {/* Privacy status */}
                  <td className="py-3 px-3">
                    {item.isCustomPrivacy ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Customised
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Baseline
                      </span>
                    )}
                  </td>

                  {/* Terms status */}
                  <td className="py-3 px-3">
                    {item.isCustomTerms ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Customised
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Baseline
                      </span>
                    )}
                  </td>

                  {/* Features */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 text-[11px]">
                      {item.site.features.ads && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px]">
                          Ads
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                        {item.site.features.analytics}
                      </span>
                    </div>
                  </td>

                  {/* Effective date */}
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {item.site.effectiveDate}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/site/?slug=${item.slug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                      <span>Edit</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
