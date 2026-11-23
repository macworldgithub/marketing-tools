'use client';

import React, { useState, useEffect } from 'react';
import { formatFileSize } from '../engines/image-io';
import { zipSync } from 'fflate';
import { RotateCcw } from 'lucide-react';

interface ConvertedPng {
  id: string;
  name: string;
  origSize: number;
  pngSize: number;
  dataUrl: string;
  pngBytes: Uint8Array;
}

export const Tool: React.FC = () => {
  const [items, setItems] = useState<ConvertedPng[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleReset = () => {
    setItems([]);
  };

  useEffect(() => {
    const onRefresh = () => handleReset();
    window.addEventListener('tool:refresh', onRefresh);
    return () => window.removeEventListener('tool:refresh', onRefresh);
  }, []);

  const convertFile = (file: File): Promise<ConvertedPng> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unsupported'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Conversion failed'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const arrayBuf = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuf);
            resolve({
              id: Math.random().toString(36).slice(2),
              name: file.name.replace(/\.[^.]+$/, '') + '.png',
              origSize: file.size,
              pngSize: blob.size,
              dataUrl: canvas.toDataURL('image/png'),
              pngBytes: bytes,
            });
          };
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    try {
      const results: ConvertedPng[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await convertFile(files[i]);
        results.push(item);
      }
      setItems((prev) => [...results, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = () => {
    if (items.length === 0) return;
    const zipData: Record<string, Uint8Array> = {};
    for (const it of items) {
      zipData[it.name] = it.pngBytes;
    }
    const zipped = zipSync(zipData);
    const blob = new Blob([zipped as any], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-png-images.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md text-xs text-blue-800 dark:text-blue-300">
        <strong>Quality Note:</strong> Converting JPG to PNG will not restore quality previously discarded by JPEG lossy compression, and PNG files are typically larger.
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {isProcessing ? 'Converting to PNG...' : 'Click or drag JPG/JPEG images here'}
        </span>
        <span className="text-xs text-slate-500 mt-1">Batch conversion supported with ZIP download</span>
        <input type="file" multiple accept="image/jpeg,image/jpg,image/webp" onChange={handleFiles} disabled={isProcessing} className="hidden" />
      </label>

      {/* Converted items */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Converted Images ({items.length})</span>
            <div className="flex items-center gap-2">
              {items.length > 1 && (
                <button onClick={handleDownloadAllZip} className="font-semibold text-blue-600 hover:underline">
                  Download All (ZIP)
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Reset converted files"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {items.map((it) => (
              <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 truncate pr-4">
                  <img src={it.dataUrl} alt={it.name} className="w-10 h-10 object-cover rounded bg-slate-100" />
                  <div className="truncate">
                    <div className="font-medium text-slate-900 dark:text-white truncate">{it.name}</div>
                    <div className="text-slate-500">
                      JPG: {formatFileSize(it.origSize)} → PNG: {formatFileSize(it.pngSize)}
                    </div>
                  </div>
                </div>
                <a
                  href={it.dataUrl}
                  download={it.name}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold whitespace-nowrap"
                >
                  Download PNG
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};