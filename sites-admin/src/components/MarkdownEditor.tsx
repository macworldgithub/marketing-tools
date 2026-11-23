'use client';

import React, { useRef } from 'react';
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Code,
  Quote,
  Calendar,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  title: string;
  onBumpDate?: () => void;
  effectiveDate?: string;
  isCustomized?: boolean;
  onShowBaselineDiff?: () => void;
}

const TEMPLATE_VARIABLES = [
  '{{siteName}}',
  '{{toolName}}',
  '{{domain}}',
  '{{contactEmail}}',
  '{{effectiveDate}}',
  '{{localStorageKeys}}',
];

const TEMPLATE_CONDITIONS = [
  { label: '{{#if ads}}', code: '{{#if ads}}\n\n{{/if}}' },
  { label: '{{#if analytics}}', code: '{{#if analytics}}\n\n{{/if}}' },
  { label: '{{#if localStorage}}', code: '{{#if localStorage}}\n\n{{/if}}' },
];

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  title,
  onBumpDate,
  effectiveDate,
  isCustomized,
  onShowBaselineDiff,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + snippet + after;
    onChange(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  const wrapSelection = (beforeTag: string, afterTag: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const wrapped = beforeTag + selected + afterTag;
    insertText(wrapped);
  };

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const chars = value.length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>
          {isCustomized !== undefined && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isCustomized
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {isCustomized ? 'Customised' : 'Same as baseline'}
            </span>
          )}
          {isCustomized && onShowBaselineDiff && (
            <button
              type="button"
              onClick={onShowBaselineDiff}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
            >
              View baseline diff
            </button>
          )}
        </div>

        {/* Date and actions */}
        <div className="flex items-center gap-2">
          {effectiveDate && (
            <span className="text-[11px] text-slate-500 font-mono">
              Effective: {effectiveDate}
            </span>
          )}
          {onBumpDate && (
            <button
              type="button"
              onClick={onBumpDate}
              title="Bump effective date to today"
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors"
            >
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>Bump date</span>
            </button>
          )}
        </div>
      </div>

      {/* Formatting & Variable Pill Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
        {/* Markdown controls */}
        <div className="flex items-center space-x-0.5 border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-1.5">
          <button
            type="button"
            onClick={() => wrapSelection('## ', '')}
            title="Heading 2 (##)"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('### ', '')}
            title="Heading 3 (###)"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('**', '**')}
            title="Bold (**)"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*')}
            title="Italic (*)"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('- ', '')}
            title="Bullet list"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('[', '](https://example.com)')}
            title="Link"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('`', '`')}
            title="Inline code"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('> ', '')}
            title="Blockquote"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Variables Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-slate-400 font-semibold uppercase mr-0.5">Vars:</span>
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertText(v)}
              className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-mono hover:bg-blue-100"
            >
              {v}
            </button>
          ))}
          <span className="text-[10px] text-slate-400 font-semibold uppercase mx-1">Blocks:</span>
          {TEMPLATE_CONDITIONS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => insertText(c.code)}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono hover:bg-slate-200"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="flex-1 relative flex flex-col">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write policy template in Markdown..."
          spellCheck={false}
          className="flex-1 w-full p-3 sm:p-4 font-mono text-xs leading-relaxed bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none resize-none min-h-[320px] sm:min-h-[450px]"
        />
      </div>

      {/* Footer bar */}
      <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-500 flex flex-wrap justify-between items-center gap-1">
        <div>
          <span>{words} words</span> · <span>{chars} characters</span>
        </div>
        <div className="text-[10px] text-slate-400">
          Strict template syntax (only h2-h3 permitted)
        </div>
      </div>
    </div>
  );
};

