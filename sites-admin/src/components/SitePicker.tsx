import React, { useState } from 'react';
import { Check, Search, X } from 'lucide-react';

interface SitePickerProps {
  availableSites: string[];
  selectedSites: string[];
  onChange: (selected: string[]) => void;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SitePicker: React.FC<SitePickerProps> = ({
  availableSites,
  selectedSites,
  onChange,
  title = 'Select Sites',
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = availableSites.filter((slug) =>
    slug.toLowerCase().includes(query.toLowerCase())
  );

  const toggleSite = (slug: string) => {
    if (selectedSites.includes(slug)) {
      onChange(selectedSites.filter((s) => s !== slug));
    } else {
      onChange([...selectedSites, slug]);
    }
  };

  const selectAll = () => onChange([...availableSites]);
  const clearAll = () => onChange([]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter sites..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{selectedSites.length} of {availableSites.length} selected</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((slug) => {
            const isSelected = selectedSites.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleSite(slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors text-left ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{slug}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">No sites matching &quot;{query}&quot;</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

