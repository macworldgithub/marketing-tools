// GENERATED from _template — do not edit here
export type BackgroundType = 'solid' | 'linear-gradient' | 'radial-gradient' | 'pattern' | 'image';
export type PatternType = 'dots' | 'grid' | 'stripes' | 'noise';

export interface ColorStop {
  color: string;
  position: number; // 0 to 100
}

export interface BackgroundConfig {
  type: BackgroundType;
  width: number;
  height: number;
  backgroundColor: string;
  // Gradients
  gradientAngleDeg?: number; // for linear
  colorStops?: ColorStop[];
  // Pattern
  patternType?: PatternType;
  patternScale?: number; // in pixels
  patternOpacity?: number; // 0 to 1
  patternColor?: string;
  // Image overlay
  imageOverlayColor?: string;
  imageOverlayOpacity?: number;
  imageBlurPx?: number;
}

export const RESOLUTION_PRESETS: Record<string, { width: number; height: number; label: string }> = {
  '1920x1080': { width: 1920, height: 1080, label: 'Full HD (1920 × 1080)' },
  '2560x1440': { width: 2560, height: 1440, label: '2K / QHD (2560 × 1440)' },
  '3840x2160': { width: 3840, height: 2160, label: '4K Ultra HD (3840 × 2160)' },
  '1080x1920': { width: 1080, height: 1920, label: 'Mobile Portrait (1080 × 1920)' },
  '1280x720': { width: 1280, height: 720, label: 'HD (1280 × 720)' },
};

/**
 * Generates copyable CSS for gradient configurations
 */
export function generateBackgroundCss(config: BackgroundConfig): string {
  if (config.type === 'solid') {
    return `background-color: ${config.backgroundColor};`;
  }

  const stops = (config.colorStops || [
    { color: config.backgroundColor, position: 0 },
    { color: '#0f172a', position: 100 },
  ])
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ');

  if (config.type === 'linear-gradient') {
    const angle = config.gradientAngleDeg ?? 135;
    return `background: linear-gradient(${angle}deg, ${stops});`;
  }

  if (config.type === 'radial-gradient') {
    return `background: radial-gradient(circle at center, ${stops});`;
  }

  return `background-color: ${config.backgroundColor};`;
}

/**
 * Draws the configured background onto a canvas 2D context
 */
export function renderBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  config: BackgroundConfig,
  sourceImage?: CanvasImageSource
): void {
  const { width, height } = config;

  ctx.clearRect(0, 0, width, height);

  if (config.type === 'solid') {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (config.type === 'linear-gradient') {
    const angleRad = ((config.gradientAngleDeg ?? 135) * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.sqrt(cx * cx + cy * cy);
    const x0 = cx - Math.cos(angleRad) * r;
    const y0 = cy - Math.sin(angleRad) * r;
    const x1 = cx + Math.cos(angleRad) * r;
    const y1 = cy + Math.sin(angleRad) * r;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    const stops = config.colorStops || [
      { color: config.backgroundColor, position: 0 },
      { color: '#0f172a', position: 100 },
    ];
    for (const stop of stops) {
      grad.addColorStop(Math.min(1, Math.max(0, stop.position / 100)), stop.color);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (config.type === 'radial-gradient') {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(width, height) / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const stops = config.colorStops || [
      { color: config.backgroundColor, position: 0 },
      { color: '#0f172a', position: 100 },
    ];
    for (const stop of stops) {
      grad.addColorStop(Math.min(1, Math.max(0, stop.position / 100)), stop.color);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (config.type === 'pattern') {
    // Fill background base
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.fillStyle = config.patternColor || '#ffffff';
    ctx.globalAlpha = config.patternOpacity ?? 0.2;
    const scale = config.patternScale ?? 30;

    if (config.patternType === 'dots') {
      const radius = Math.max(1, scale * 0.1);
      for (let x = scale / 2; x < width; x += scale) {
        for (let y = scale / 2; y < height; y += scale) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (config.patternType === 'grid') {
      ctx.lineWidth = 1;
      ctx.strokeStyle = config.patternColor || '#ffffff';
      for (let x = 0; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (config.patternType === 'stripes') {
      ctx.lineWidth = scale * 0.4;
      ctx.strokeStyle = config.patternColor || '#ffffff';
      for (let d = -height; d < width + height; d += scale) {
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(d + height, height);
        ctx.stroke();
      }
    }
    ctx.restore();
    return;
  }

  if (config.type === 'image' && sourceImage) {
    if (config.imageBlurPx && config.imageBlurPx > 0) {
      ctx.filter = `blur(${config.imageBlurPx}px)`;
    }
    ctx.drawImage(sourceImage, 0, 0, width, height);
    ctx.filter = 'none';

    if (config.imageOverlayColor && (config.imageOverlayOpacity ?? 0) > 0) {
      ctx.save();
      ctx.fillStyle = config.imageOverlayColor;
      ctx.globalAlpha = config.imageOverlayOpacity ?? 0.3;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}
