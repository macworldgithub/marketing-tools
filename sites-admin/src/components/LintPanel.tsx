import React from 'react';
import { LintMessage } from '../lib/content/types';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface LintPanelProps {
  messages: LintMessage[];
  productionErrors?: string[];
}

export const LintPanel: React.FC<LintPanelProps> = ({ messages, productionErrors = [] }) => {
  const allErrors: LintMessage[] = [
    ...messages.filter((m) => m.type === 'error'),
    ...productionErrors.map((err) => ({
      type: 'error' as const,
      rule: 'production-build-error',
      message: err,
      source: 'production-renderer' as const,
    })),
  ];

  const allWarnings = messages.filter((m) => m.type === 'warning');

  if (allErrors.length === 0 && allWarnings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium">
        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>All content rules passed. Ready to commit.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      {/* Error block */}
      {allErrors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-red-800 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{allErrors.length} Validation Error{allErrors.length > 1 ? 's' : ''} (Save Disabled)</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-red-700 dark:text-red-300">
            {allErrors.map((err, idx) => (
              <li key={idx}>
                {err.source === 'production-renderer' && (
                  <span className="font-semibold uppercase text-[10px] bg-red-200 dark:bg-red-900 px-1 py-0.5 rounded mr-1.5">
                    Production Renderer
                  </span>
                )}
                <span>{err.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning block */}
      {allWarnings.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{allWarnings.length} Recommendation{allWarnings.length > 1 ? 's' : ''}</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-amber-700 dark:text-amber-300">
            {allWarnings.map((warn, idx) => (
              <li key={idx}>{warn.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

