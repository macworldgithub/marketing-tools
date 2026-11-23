// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import { generateBackgroundCss, RESOLUTION_PRESETS } from './index';

describe('Background Image Maker Engine', () => {
  it('generates correct linear gradient CSS', () => {
    const css = generateBackgroundCss({
      type: 'linear-gradient',
      width: 1920,
      height: 1080,
      backgroundColor: '#1e293b',
      gradientAngleDeg: 90,
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
    });

    expect(css).toBe('background: linear-gradient(90deg, #ff0000 0%, #0000ff 100%);');
  });

  it('generates correct solid background CSS', () => {
    const css = generateBackgroundCss({
      type: 'solid',
      width: 1920,
      height: 1080,
      backgroundColor: '#3b82f6',
    });

    expect(css).toBe('background-color: #3b82f6;');
  });

  it('includes standard resolution presets up to 4K', () => {
    expect(RESOLUTION_PRESETS['1920x1080'].width).toBe(1920);
    expect(RESOLUTION_PRESETS['2560x1440'].width).toBe(2560);
    expect(RESOLUTION_PRESETS['3840x2160'].width).toBe(3840);
    expect(RESOLUTION_PRESETS['1080x1920'].height).toBe(1920);
  });
});
