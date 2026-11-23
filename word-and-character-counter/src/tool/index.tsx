'use client';

import React, { useState } from 'react';
import { analyzeText } from '../engines/text-stats';

export const Tool: React.FC = () => {
  const [text, setText] = useState<string>(
    'Hello, world! It\'s a well-known fact that writing clean, concise text improves readability and user engagement.'
  );
  const [excludeStopWords, setExcludeStopWords] = useState<boolean>(true);

  const stats = analyzeText(text, { excludeStopWords });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Editor */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full p-3 font-sans text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Type or paste your text here..."
        />
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.words}</div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.charactersWithSpaces}</div>
          <div className="text-xs text-slate-500">Characters</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.sentences}</div>
          <div className="text-xs text-slate-500">Sentences</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.paragraphs}</div>
          <div className="text-xs text-slate-500">Paragraphs</div>
        </div>
      </div>

      {/* Reading & Speaking Times */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <div>
          <span className="text-slate-500 block">Reading Time (238 WPM)</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{stats.readingTimeText}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Speaking Time (150 WPM)</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{stats.speakingTimeText}</span>
        </div>
      </div>

      {/* Keyword Density */}
      {stats.topKeywords.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Top Keywords & Density</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
              <input
                type="checkbox"
                checked={excludeStopWords}
                onChange={(e) => setExcludeStopWords(e.target.checked)}
                className="rounded"
              />
              <span>Filter Stop Words</span>
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.topKeywords.map((kw, idx) => (
              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-medium text-slate-900 dark:text-white truncate">{kw.word}</div>
                <div className="text-[11px] text-slate-500">
                  {kw.count}x ({kw.density}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};