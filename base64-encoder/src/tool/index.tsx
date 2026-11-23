'use client';

import React, { useState } from 'react';
import { encodeBase64, decodeBase64, bytesToBase64 } from '../engines/base64';

export const Tool: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState<string>('Hello, World!');
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [lineWrap, setLineWrap] = useState<boolean>(false);
  const [dataUri, setDataUri] = useState<boolean>(false);
  const [mimeType, setMimeType] = useState<string>('text/plain');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  let output = '';
  try {
    if (mode === 'encode') {
      const encoded = encodeBase64(input, { urlSafe, lineWrap: lineWrap ? 76 : 0 });
      output = dataUri ? `data:${mimeType};base64,${encoded}` : encoded;
    } else {
      let toDecode = input.trim();
      if (toDecode.startsWith('data:')) {
        const commaIdx = toDecode.indexOf(',');
        if (commaIdx !== -1) toDecode = toDecode.slice(commaIdx + 1);
      }
      output = decodeBase64(toDecode);
    }
    if (error) setError(null);
  } catch (err: any) {
    output = '';
    if (!error) setError(err.message || 'Invalid Base64 sequence');
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      const b64 = bytesToBase64(bytes, { urlSafe, lineWrap: lineWrap ? 76 : 0 });
      setInput(b64);
      setMode('decode');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'encoded.b64.txt' : 'decoded.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Mode Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setMode('encode'); setError(null); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            mode === 'encode'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Encode to Base64
        </button>
        <button
          onClick={() => { setMode('decode'); setError(null); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            mode === 'decode'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Decode from Base64
        </button>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
        {mode === 'encode' && (
          <>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} className="rounded" />
              <span>URL-Safe (- and _)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={lineWrap} onChange={(e) => setLineWrap(e.target.checked)} className="rounded" />
              <span>MIME Wrap (76 chars)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={dataUri} onChange={(e) => setDataUri(e.target.checked)} className="rounded" />
              <span>Data URI Prefix</span>
            </label>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="cursor-pointer px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-700">
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => { setInput(''); setError(null); }}
            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Input */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{mode === 'encode' ? 'Plain Text / Input' : 'Base64 Input'}</span>
          <span>{input.length} chars</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste Base64 string to decode...'}
          rows={5}
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400">
          <strong>Decoding Error:</strong> {error}
        </div>
      )}

      {/* Output */}
      <div>
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{mode === 'encode' ? 'Base64 Result' : 'Decoded Text'}</span>
          <span>{output.length} chars</span>
        </div>
        <textarea
          value={output}
          readOnly
          rows={5}
          placeholder="Result will appear here..."
          className="w-full p-3 font-mono text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          disabled={!output}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
        >
          {copied ? 'Copied to Clipboard!' : 'Copy Result'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!output}
          className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Download
        </button>
      </div>
    </div>
  );
};