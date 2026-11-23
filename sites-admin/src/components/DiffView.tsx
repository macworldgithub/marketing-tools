import React from 'react';
import * as Diff from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
  oldTitle?: string;
  newTitle?: string;
}

export const DiffView: React.FC<DiffViewProps> = ({
  oldText,
  newText,
  oldTitle = 'Baseline / Original',
  newTitle = 'Current Draft',
}) => {
  const diff = Diff.diffLines(oldText, newText);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden font-mono text-xs bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700 text-slate-300">
        <span>--- {oldTitle}</span>
        <span>+++ {newTitle}</span>
      </div>
      <div className="overflow-x-auto p-2 space-y-0.5 max-h-[400px] overflow-y-auto">
        {diff.map((part, index) => {
          const bg = part.added
            ? 'bg-emerald-950/80 text-emerald-300'
            : part.removed
            ? 'bg-red-950/80 text-red-300 line-through'
            : 'text-slate-400';
          const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';

          return (
            <div key={index} className={`px-2 py-0.5 rounded-xs ${bg} whitespace-pre-wrap`}>
              {part.value.split('\n').filter((l, i, arr) => i < arr.length - 1 || l.length > 0).map((line, lIdx) => (
                <div key={lIdx}>{prefix}{line}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

