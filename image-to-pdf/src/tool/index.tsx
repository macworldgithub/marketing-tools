'use client';

import React, { useState, useEffect } from 'react';
import { imagesToPDF, PageSizeOption, PageOrientation, PageFit, PDFImageInput } from '../engines/pdf';
import { RotateCcw } from 'lucide-react';

interface ImageEntry {
  id: string;
  name: string;
  width: number;
  height: number;
  bytes: Uint8Array;
  format: 'jpeg' | 'png';
  previewUrl: string;
}

export const Tool: React.FC = () => {
  const [pageSize, setPageSize] = useState<PageSizeOption>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [marginPt, setMarginPt] = useState<number>(36);
  const [fit, setFit] = useState<PageFit>('contain');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleReset = () => {
    setPageSize('A4');
    setOrientation('portrait');
    setMarginPt(36);
    setFit('contain');
    setImages([]);
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuf = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuf);
        const img = new Image();
        const previewUrl = URL.createObjectURL(file);
        img.onload = () => {
          const format: 'jpeg' | 'png' = file.type === 'image/jpeg' ? 'jpeg' : 'png';
          setImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              name: file.name,
              width: img.width,
              height: img.height,
              bytes,
              format,
              previewUrl,
            },
          ]);
        };
        img.src = previewUrl;
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const moveDown = (idx: number) => {
    setImages((prev) => {
      if (idx >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    try {
      const inputs: PDFImageInput[] = images.map((img) => ({
        bytes: img.bytes,
        width: img.width,
        height: img.height,
        format: img.format,
      }));

      const pdfBytes = await imagesToPDF(inputs, { pageSize, orientation, marginPt, fit });
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Settings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Page Size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="Letter">US Letter</option>
            <option value="FitToImage">Fit to Image</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Orientation</label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as PageOrientation)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
            <option value="auto">Auto (Match Image)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Margin</label>
          <select
            value={marginPt}
            onChange={(e) => setMarginPt(parseInt(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value={0}>No Margin (0 pt)</option>
            <option value={18}>Narrow (18 pt)</option>
            <option value={36}>Standard (36 pt)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Image Fit</label>
          <select
            value={fit}
            onChange={(e) => setFit(e.target.value as PageFit)}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-md"
          >
            <option value="contain">Contain (Keep Ratio)</option>
            <option value="cover">Cover (Fill Page)</option>
            <option value="stretch">Stretch to Fit</option>
          </select>
        </div>
      </div>

      {/* File Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Click or drag images to add pages
        </span>
        <span className="text-xs text-slate-500 mt-1">PNG and JPEG supported</span>
        <input type="file" multiple accept="image/png,image/jpeg" onChange={handleFiles} className="hidden" />
      </label>

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Pages ({images.length})</span>
            <button onClick={() => setImages([])} className="hover:text-slate-800 dark:hover:text-slate-200">
              Clear All
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            {images.map((img, idx) => (
              <div key={img.id} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 truncate pr-4">
                  <span className="font-semibold text-slate-400 w-4">{idx + 1}</span>
                  <img src={img.previewUrl} alt={img.name} className="w-8 h-8 object-cover rounded bg-slate-100" />
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">{img.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="px-2 py-1 text-slate-600 disabled:opacity-30">
                    ▲
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === images.length - 1} className="px-2 py-1 text-slate-600 disabled:opacity-30">
                    ▼
                  </button>
                  <button onClick={() => removeImage(img.id)} className="px-2 py-1 text-red-600">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleGeneratePdf}
        disabled={images.length === 0 || isGenerating}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-sm font-semibold transition-colors"
      >
        {isGenerating ? 'Building PDF Document...' : `Generate PDF (${images.length} Pages)`}
      </button>
    </div>
  );
};