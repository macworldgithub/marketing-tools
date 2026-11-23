'use client';

import React, { useState, useRef } from 'react';
import { calculateDimensionsByWidth, calculateDimensionsByHeight, calculateDimensionsByPercentage, formatFileSize } from '../engines/image-io';
import { Upload, Download, RotateCcw, Lock, Unlock, Image as ImageIcon } from 'lucide-react';

export const Tool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(null);
  const [targetWidth, setTargetWidth] = useState<string>('1200');
  const [targetHeight, setTargetHeight] = useState<string>('900');
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.85);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    setFile(selectedFile);

    const img = new Image();
    const objectUrl = URL.createObjectURL(selectedFile);
    img.onload = () => {
      setOrigDims({ width: img.naturalWidth, height: img.naturalHeight });
      setTargetWidth(String(img.naturalWidth));
      setTargetHeight(String(img.naturalHeight));
      setPreviewUrl(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleWidthChange = (val: string) => {
    setTargetWidth(val);
    const num = parseInt(val, 10);
    if (lockRatio && origDims && !isNaN(num) && num > 0) {
      const newDims = calculateDimensionsByWidth(origDims.width, origDims.height, num);
      setTargetHeight(String(newDims.height));
    }
  };

  const handleHeightChange = (val: string) => {
    setTargetHeight(val);
    const num = parseInt(val, 10);
    if (lockRatio && origDims && !isNaN(num) && num > 0) {
      const newDims = calculateDimensionsByHeight(origDims.width, origDims.height, num);
      setTargetWidth(String(newDims.width));
    }
  };

  const applyPercentage = (pct: number) => {
    if (!origDims) return;
    const newDims = calculateDimensionsByPercentage(origDims.width, origDims.height, pct);
    setTargetWidth(String(newDims.width));
    setTargetHeight(String(newDims.height));
  };

  const handleDownload = async () => {
    if (!file || !origDims) return;
    setIsProcessing(true);

    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      const w = parseInt(targetWidth, 10) || origDims.width;
      const h = parseInt(targetHeight, 10) || origDims.height;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
          a.href = url;
          a.download = `resized-${w}x${h}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
          setIsProcessing(false);
        },
        format,
        quality
      );
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-accent-primary rounded-lg p-10 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Click or drag an image here to resize
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports JPG, PNG, WebP, GIF, and BMP (Up to 50MB, processed 100% in browser)
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-accent-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">Original: {origDims?.width} × {origDims?.height} px ({formatFileSize(file.size)})</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              className="text-xs text-slate-500 hover:text-red-500 min-h-[44px] px-2"
            >
              Change Image
            </button>
          </div>

          {/* Dimension Controls */}
          <div className="space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Target Dimensions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Height (px)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setLockRatio(!lockRatio)}
                    title={lockRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                    className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300"
                  >
                    {lockRatio ? <Lock className="w-4 h-4 text-accent-primary" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Percentage Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Scale:</span>
              {[25, 50, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyPercentage(pct)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[36px]"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Export Format & Quality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Output Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white min-h-[44px]"
              >
                <option value="image/jpeg">JPG / JPEG</option>
                <option value="image/png">PNG (Lossless)</option>
                <option value="image/webp">WebP (Modern)</option>
              </select>
            </div>

            {format !== 'image/png' && (
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-accent-primary"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Resizing...' : 'Download Resized Image'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};