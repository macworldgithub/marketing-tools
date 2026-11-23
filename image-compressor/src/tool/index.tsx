'use client';

import React, { useState } from 'react';
import { formatFileSize, calculateCompressionSaved } from '../engines/image-io';

interface CompressedItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  savedPct: number;
  dataUrl: string;
}

export const Tool: React.FC = () => {
  const [quality, setQuality] = useState<number>(0.75);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [maxDimension, setMaxDimension] = useState<number>(2048);
  const [items, setItems] = useState<CompressedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const processFile = (file: File): Promise<CompressedItem> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (maxDimension > 0 && (w > maxDimension || h > maxDimension)) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unsupported'));
          return;
        }

        // Fill white background for JPEGs
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const isSmaller = blob.size < file.size;
            const finalBlob = isSmaller ? blob : file;
            const finalSize = finalBlob.size;
            const savedPct = calculateCompressionSaved(file.size, finalSize);

            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: Math.random().toString(36).slice(2),
                name: file.name,
                originalSize: file.size,
                compressedSize: finalSize,
                savedPct,
                dataUrl: reader.result as string,
              });
            };
            reader.readAsDataURL(finalBlob);
          },
          format,
          quality
        );
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
      const results: CompressedItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await processFile(files[i]);
        results.push(item);
      }
      setItems((prev) => [...results, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Notice */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-xs text-emerald-800 dark:text-emerald-300">
        100% Client-Side. Images are never uploaded to a server. Metadata (EXIF/GPS) is stripped automatically.
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Quality ({Math.round(quality * 100)}%)
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Target Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            <option value="image/jpeg">JPEG (.jpg)</option>
            <option value="image/webp">WebP (.webp)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Max Dimension (px)</label>
          <input
            type="number"
            value={maxDimension}
            onChange={(e) => setMaxDimension(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {isProcessing ? 'Compressing images...' : 'Click to select or drag images here'}
        </span>
        <span className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP supported</span>
        <input type="file" multiple accept="image/*" onChange={handleFiles} disabled={isProcessing} className="hidden" />
      </label>

      {/* Compressed Items List */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Processed Images ({items.length})</span>
            <button onClick={() => setItems([])} className="hover:text-slate-800 dark:hover:text-slate-200">
              Clear All
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {items.map((it) => (
              <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 truncate pr-4">
                  <img src={it.dataUrl} alt={it.name} className="w-10 h-10 object-cover rounded bg-slate-100" />
                  <div className="truncate">
                    <div className="font-medium text-slate-900 dark:text-white truncate">{it.name}</div>
                    <div className="text-slate-500">
                      {formatFileSize(it.originalSize)} → {formatFileSize(it.compressedSize)}
                      {it.savedPct > 0 ? (
                        <span className="ml-2 text-emerald-600 font-semibold">(-{it.savedPct}%)</span>
                      ) : (
                        <span className="ml-2 text-slate-400">(Original preserved)</span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={it.dataUrl}
                  download={`compressed-${it.name.replace(/\.[^.]+$/, '')}.${format === 'image/jpeg' ? 'jpg' : 'webp'}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold whitespace-nowrap"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};