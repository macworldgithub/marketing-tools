'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BackgroundConfig,
  BackgroundType,
  PatternType,
  RESOLUTION_PRESETS,
  generateBackgroundCss,
  renderBackgroundToCanvas,
} from '../engines/background';
import { Copy, Download, Check, Sparkles, RotateCcw } from 'lucide-react';

export function Tool() {
  const [bgType, setBgType] = useState<BackgroundType>('linear-gradient');
  const [preset, setPreset] = useState<string>('1920x1080');
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [color1, setColor1] = useState<string>('#3b82f6');
  const [color2, setColor2] = useState<string>('#1e293b');
  const [angle, setAngle] = useState<number>(135);
  const [patternType, setPatternType] = useState<PatternType>('dots');
  const [patternScale, setPatternScale] = useState<number>(24);
  const [patternOpacity, setPatternOpacity] = useState<number>(0.2);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleReset = () => {
    setBgType('linear-gradient');
    setPreset('1920x1080');
    setWidth(1920);
    setHeight(1080);
    setColor1('#3b82f6');
    setColor2('#1e293b');
    setAngle(135);
    setPatternType('dots');
    setPatternScale(24);
    setPatternOpacity(0.2);
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  };

  const cssCode = generateBackgroundCss(config);

  const handlePresetChange = (presetKey: string) => {
    setPreset(presetKey);
    if (presetKey !== 'custom' && RESOLUTION_PRESETS[presetKey]) {
      setWidth(RESOLUTION_PRESETS[presetKey].width);
      setHeight(RESOLUTION_PRESETS[presetKey].height);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a preview resolution proportional to target aspect ratio
    const maxPreviewW = 640;
    const maxPreviewH = 360;
    const safeW = Math.max(1, width || 1920);
    const safeH = Math.max(1, height || 1080);
    const aspect = safeW / safeH;

    let pW = maxPreviewW;
    let pH = Math.round(maxPreviewW / aspect);
    if (pH > maxPreviewH) {
      pH = maxPreviewH;
      pW = Math.round(maxPreviewH * aspect);
    }

    canvas.width = pW;
    canvas.height = pH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewConfig: BackgroundConfig = {
      ...config,
      width: pW,
      height: pH,
      patternScale: Math.max(8, Math.round(patternScale * (pW / width))),
    };

    renderBackgroundToCanvas(ctx, previewConfig);
  }, [bgType, width, height, color1, color2, angle, patternType, patternScale, patternOpacity]);

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleDownload = async (format: 'png' | 'jpeg') => {
    setDownloading(true);
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      renderBackgroundToCanvas(ctx, config);

      offscreen.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `background-${width}x${height}.${format === 'png' ? 'png' : 'jpg'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setDownloading(false);
        },
        format === 'png' ? 'image/png' : 'image/jpeg',
        0.95
      );
    } catch {
      setDownloading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Controls Column */}
        <div className="space-y-6 lg:col-span-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">Background Style</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: 'linear-gradient', label: 'Linear' },
                { id: 'radial-gradient', label: 'Radial' },
                { id: 'solid', label: 'Solid' },
                { id: 'pattern', label: 'Pattern' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setBgType(style.id as BackgroundType)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    bgType === style.id
                      ? 'border-accent bg-accent text-accent-foreground font-semibold shadow-xs'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="color-1" className="mb-1.5 block text-xs font-medium text-foreground">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="color-1"
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground uppercase"
                />
              </div>
            </div>

            {bgType !== 'solid' && (
              <div>
                <label htmlFor="color-2" className="mb-1.5 block text-xs font-medium text-foreground">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="color-2"
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground uppercase"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Angle for Linear Gradient */}
          {bgType === 'linear-gradient' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="gradient-angle" className="text-xs font-medium text-foreground">
                  Gradient Angle: {angle}°
                </label>
              </div>
              <input
                id="gradient-angle"
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          )}

          {/* Pattern Options */}
          {bgType === 'pattern' && (
            <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Pattern Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dots', 'grid', 'stripes'] as PatternType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPatternType(p)}
                      className={`rounded-md border px-2 py-1.5 text-xs capitalize transition-colors ${
                        patternType === p
                          ? 'border-accent bg-accent text-accent-foreground font-semibold'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="pattern-density" className="text-xs font-medium text-foreground">
                    Scale / Density: {patternScale}px
                  </label>
                </div>
                <input
                  id="pattern-density"
                  type="range"
                  min="8"
                  max="64"
                  value={patternScale}
                  onChange={(e) => setPatternScale(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          )}

          {/* Resolution Preset */}
          <div>
            <label htmlFor="preset-select" className="mb-1.5 block text-xs font-medium text-foreground">
              Resolution
            </label>
            <select
              id="preset-select"
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
            >
              {Object.entries(RESOLUTION_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
              <option value="custom">Custom Dimensions</option>
            </select>
          </div>

          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="custom-width" className="mb-1 block text-xs text-muted-foreground">
                  Width (px)
                </label>
                <input
                  id="custom-width"
                  type="number"
                  min="100"
                  max="7680"
                  value={width}
                  onChange={(e) => setWidth(Math.max(10, Number(e.target.value)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label htmlFor="custom-height" className="mb-1 block text-xs text-muted-foreground">
                  Height (px)
                </label>
                <input
                  id="custom-height"
                  type="number"
                  min="100"
                  max="4320"
                  value={height}
                  onChange={(e) => setHeight(Math.max(10, Number(e.target.value)))}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                />
              </div>
            </div>
          )}

          {/* Presets Quick Palette */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Suggested Palettes</label>
            <div className="flex flex-wrap gap-2">
              {[
                ['#3b82f6', '#1e293b'],
                ['#0ea5e9', '#0284c7'],
                ['#6366f1', '#4338ca'],
                ['#10b981', '#064e3b'],
                ['#64748b', '#0f172a'],
                ['#f43f5e', '#881337'],
              ].map(([c1, c2], idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Palette ${idx + 1}`}
                  onClick={() => {
                    setColor1(c1);
                    setColor2(c2);
                  }}
                  className="h-6 w-9 rounded border border-border shadow-2xs transition-transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Canvas Preview Column */}
        <div className="flex flex-col lg:col-span-7">
          <label className="mb-2 block text-sm font-semibold text-foreground">Live Canvas Preview</label>
          <div className="relative flex min-h-[300px] flex-1 items-center justify-center rounded-xl border border-border bg-muted/20 p-4">
            <canvas
              ref={canvasRef}
              className="max-h-[360px] max-w-full rounded-lg border border-border shadow-md object-contain"
            />
          </div>

          {/* CSS output & download action bar */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
              <code className="flex-1 overflow-x-auto font-mono text-xs text-foreground select-all">
                {cssCode}
              </code>
              <button
                type="button"
                onClick={handleCopyCss}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy CSS'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                title="Reset background options to default"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('png')}
                disabled={downloading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground shadow-xs transition-colors hover:opacity-90 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download PNG ({width}×{height})
              </button>
              <button
                type="button"
                onClick={() => handleDownload('jpeg')}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                JPEG
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

