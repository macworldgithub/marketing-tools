'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { getContrastRatio } from '../engines/qr';
import { Download, AlertTriangle, Link as LinkIcon, Mail, Phone, MessageSquare, User, FileText } from 'lucide-react';

export const Tool: React.FC = () => {
  const [contentType, setContentType] = useState<'url' | 'text' | 'email' | 'phone' | 'sms'>('url');
  const [inputVal, setInputVal] = useState<string>('https://example.com');
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState<string>('');

  const contrast = getContrastRatio(fgColor, bgColor);

  useEffect(() => {
    if (!inputVal) return;

    // Render Canvas
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, inputVal, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: ecLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      }).catch(() => {});
    }

    // Render SVG string
    QRCode.toString(inputVal, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: ecLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((svg) => setSvgString(svg))
      .catch(() => {});
  }, [inputVal, fgColor, bgColor, ecLevel]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.png';
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      {/* Content Type Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { id: 'url', label: 'URL', icon: LinkIcon, defaultVal: 'https://example.com' },
          { id: 'text', label: 'Text', icon: FileText, defaultVal: 'Hello world' },
          { id: 'email', label: 'Email', icon: Mail, defaultVal: 'mailto:contact@example.com' },
          { id: 'phone', label: 'Phone', icon: Phone, defaultVal: 'tel:+15550199' },
          { id: 'sms', label: 'SMS', icon: MessageSquare, defaultVal: 'smsto:+15550199:Hello' },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = contentType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setContentType(t.id as any); setInputVal(t.defaultVal); }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md min-h-[44px] transition-colors ${
                isActive ? 'bg-accent-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Field */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {contentType === 'url' ? 'Destination Website URL' : 'Content to Encode'}
        </label>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter content..."
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[44px]"
        />
      </div>

      {/* QR Code Graphic Preview & Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
          <canvas ref={canvasRef} className="max-w-full rounded shadow-xs" />

          {/* Contrast warning */}
          {(contrast.isLowContrast || contrast.isInverted) && (
            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {contrast.isInverted ? 'Inverted colors (light on dark) may not scan.' : 'Low contrast (<4.5:1) may fail on mobile scanners.'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Error Correction</label>
            <select
              value={ecLevel}
              onChange={(e) => setEcLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
            >
              <option value="L">L - Low (~7% recovery)</option>
              <option value="M">M - Medium (~15% recovery, Recommended)</option>
              <option value="Q">Q - Quartile (~25% recovery)</option>
              <option value="H">H - High (~30% recovery)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Foreground</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{fgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{bgColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Vector SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};