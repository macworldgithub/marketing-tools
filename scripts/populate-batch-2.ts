import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');

function writeToolContent(
  slug: string,
  siteJson: any,
  faqs: { id: string; question: string; answer: string }[],
  explainerMd: string
) {
  const dir = path.join(ROOT_DIR, slug, 'content');
  fs.writeFileSync(path.join(dir, 'site.json'), JSON.stringify(siteJson, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'faqs.json'), JSON.stringify({ schemaVersion: 1, items: faqs }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'explainer.md'), explainerMd.trim(), 'utf-8');
}

function writeToolComponent(slug: string, tsxCode: string) {
  const file = path.join(ROOT_DIR, slug, 'src', 'tool', 'index.tsx');
  fs.writeFileSync(file, tsxCode.trim(), 'utf-8');
}

// ============================================================================
// 10. BACKGROUND IMAGE MAKER
// ============================================================================
const bgSite = {
  schemaVersion: 1,
  slug: 'background-image',
  siteName: 'Background Image Maker',
  toolName: 'Background Image Maker',
  primaryKeyword: 'background image',
  domain: 'TODO-set-domain.com',
  tagline: 'Generate custom wallpapers, gradients, patterns, and blurred image backgrounds directly in your browser.',
  contactEmail: 'TODO@TODO-set-domain.com',
  accent: 'indigo',
  effectiveDate: '2026-11-23',
  features: { ads: false, analytics: 'none', localStorageKeys: ['theme'] },
};

const bgFaqs = [
  {
    id: 'how-are-backgrounds-generated',
    question: 'How are backgrounds generated without a server or stock photos?',
    answer: 'All graphics, mathematical gradients, and geometric patterns are synthesized on an HTML5 Canvas directly in your web browser. Nothing is fetched from or sent to a remote server.'
  },
  {
    id: 'supported-resolutions',
    question: 'What image resolutions and aspect ratios can I export?',
    answer: 'Standard presets include Full HD (1920x1080), 2K QHD (2560x1440), 4K UHD (3840x2160), Mobile Portrait (1080x1920), and 720p HD. You can also define custom canvas dimensions up to 8192 pixels.'
  },
  {
    id: 'css-gradient-code',
    question: 'Can I copy the CSS code for web design?',
    answer: 'Yes. Whenever you design a linear or radial gradient, the exact CSS rule is generated with angle and color stops ready to copy into your stylesheet.'
  },
  {
    id: 'image-overlay-blur-privacy',
    question: 'Is my uploaded photo kept private when creating a blurred wallpaper?',
    answer: 'Completely private. When you upload a picture, it is loaded into your browser memory via createImageBitmap. No bytes ever leave your device.'
  },
  {
    id: 'file-formats-available',
    question: 'Which file formats can I download?',
    answer: 'You can export high-quality PNG for lossless graphics, JPEG with clean background rendering, or modern WebP.'
  }
];

const bgExplainer = `
# How Background Image Maker Works

The Background Image Maker synthesizes crisp, custom background graphics, wallpapers, and social media banners entirely within your browser using the HTML5 Canvas API.

## Generation Modes
- **Linear & Radial Gradients:** Smooth mathematical color transitions rendered with configurable angles and customizable color stops.
- **Geometric Patterns:** Crisp vector-style dots, grids, and diagonal stripes with tunable density, scale, and opacity.
- **Custom Image Backdrop:** Upload any local photograph to apply Gaussian blurs, dark or tinted color overlays, and aspect ratio cropping.
- **Export Formats:** Download clean PNG, JPG, or WebP files ready for desktop wallpaper, phone screens, or web UI backdrops.
`;

const bgToolTsx = `'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  BackgroundConfig,
  BackgroundType,
  PatternType,
  RESOLUTION_PRESETS,
  generateBackgroundCss,
  renderBackgroundToCanvas,
} from '../engines/background';

export const Tool: React.FC = () => {
  const [bgType, setBgType] = useState<BackgroundType>('linear-gradient');
  const [preset, setPreset] = useState<string>('1920x1080');
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [color1, setColor1] = useState<string>('#1e293b');
  const [color2, setColor2] = useState<string>('#0f172a');
  const [angle, setAngle] = useState<number>(135);
  const [patternType, setPatternType] = useState<PatternType>('dots');
  const [patternScale, setPatternScale] = useState<number>(32);
  const [patternOpacity, setPatternOpacity] = useState<number>(0.15);
  const [blurPx, setBlurPx] = useState<number>(10);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.4);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handlePresetChange = (key: string) => {
    setPreset(key);
    if (RESOLUTION_PRESETS[key]) {
      setWidth(RESOLUTION_PRESETS[key].width);
      setHeight(RESOLUTION_PRESETS[key].height);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLoadedImage(img);
      setBgType('image');
    };
    img.src = url;
  };

  const config: BackgroundConfig = {
    type: bgType,
    width,
    height,
    backgroundColor: color1,
    gradientAngleDeg: angle,
    colorStops: [
      { color: color1, position: 0 },
      { color: color2, position: 100 },
    ],
    patternType,
    patternScale,
    patternOpacity,
    patternColor: '#ffffff',
    imageBlurPx: blurPx,
    imageOverlayColor: '#000000',
    imageOverlayOpacity: overlayOpacity,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      renderBackgroundToCanvas(ctx, config, loadedImage || undefined);
    }
  }, [bgType, width, height, color1, color2, angle, patternType, patternScale, patternOpacity, blurPx, overlayOpacity, loadedImage]);

  const cssCode = generateBackgroundCss(config);

  const downloadImage = (format: 'png' | 'jpeg' | 'webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
    const dataUrl = canvas.toDataURL(mime, 0.92);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = \`background-\${width}x\${height}.\${format === 'jpeg' ? 'jpg' : format}\`;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[800px] mx-auto shadow-sm space-y-6">
      {/* Canvas Preview */}
      <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center relative shadow-inner">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>

      {/* Mode Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['linear-gradient', 'radial-gradient', 'pattern', 'image'] as BackgroundType[]).map((t) => (
          <button
            key={t}
            onClick={() => setBgType(t)}
            className={\`px-3 py-2 text-xs font-semibold rounded-md border capitalize transition-colors \${
              bgType === t
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }\`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Resolution & Size */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Preset Size</label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          >
            {Object.entries(RESOLUTION_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Math.max(100, Math.min(8192, parseInt(e.target.value) || 100)))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Math.max(100, Math.min(8192, parseInt(e.target.value) || 100)))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Specific Mode Settings */}
      {bgType.includes('gradient') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Color 1</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              <input type="text" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-800" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Color 2</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              <input type="text" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-800" />
            </div>
          </div>
          {bgType === 'linear-gradient' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Angle ({angle}°)</label>
              <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} className="w-full" />
            </div>
          )}
        </div>
      )}

      {bgType === 'pattern' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pattern</label>
            <select
              value={patternType}
              onChange={(e) => setPatternType(e.target.value as PatternType)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
            >
              <option value="dots">Dots</option>
              <option value="grid">Grid</option>
              <option value="stripes">Stripes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Scale ({patternScale}px)</label>
            <input type="range" min="10" max="100" value={patternScale} onChange={(e) => setPatternScale(parseInt(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Opacity ({Math.round(patternOpacity * 100)}%)</label>
            <input type="range" min="0.05" max="0.8" step="0.05" value={patternOpacity} onChange={(e) => setPatternOpacity(parseFloat(e.target.value))} className="w-full" />
          </div>
        </div>
      )}

      {bgType === 'image' && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Photo</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Blur ({blurPx}px)</label>
              <input type="range" min="0" max="40" value={blurPx} onChange={(e) => setBlurPx(parseInt(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Dark Tint ({Math.round(overlayOpacity * 100)}%)</label>
              <input type="range" min="0" max="0.9" step="0.05" value={overlayOpacity} onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Copy CSS for gradients */}
      {bgType.includes('gradient') && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-between text-xs font-mono text-slate-800 dark:text-slate-200">
          <span className="truncate mr-4">{cssCode}</span>
          <button
            onClick={() => navigator.clipboard.writeText(cssCode)}
            className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-sans hover:bg-slate-50"
          >
            Copy CSS
          </button>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={() => downloadImage('png')}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold transition-colors"
        >
          Download PNG
        </button>
        <button
          onClick={() => downloadImage('jpeg')}
          className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition-colors"
        >
          Download JPG
        </button>
        <button
          onClick={() => downloadImage('webp')}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Download WebP
        </button>
      </div>
    </div>
  );
};
`;

writeToolContent('background-image', bgSite, bgFaqs, bgExplainer);
writeToolComponent('background-image', bgToolTsx);
console.log('✓ Populated background-image');
