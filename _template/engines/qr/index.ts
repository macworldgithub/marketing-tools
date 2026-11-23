export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type QRContentType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'vcard' | 'wifi';

export interface WiFiParams {
  ssid: string;
  password?: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export function escapeWiFiString(str: string): string {
  // If string consists only of hex digits (e.g. WEP key or hex SSID), wrap in double quotes
  if (/^[0-9a-fA-F]+$/.test(str)) {
    return `"${str}"`;
  }
  // Escape \ ; , : " with backslash
  return str.replace(/([\\;,:\"])/g, '\\$1');
}

export function formatWiFiPayload(params: WiFiParams): string {
  const auth = params.security === 'nopass' ? 'nopass' : params.security;
  const escapedSsid = escapeWiFiString(params.ssid);
  let payload = `WIFI:T:${auth};S:${escapedSsid};`;

  if (params.security !== 'nopass' && params.password) {
    const escapedPassword = escapeWiFiString(params.password);
    payload += `P:${escapedPassword};`;
  }

  if (params.hidden) {
    payload += 'H:true;';
  }

  payload += ';';
  return payload;
}

export function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(fgHex: string, bgHex: string): { ratio: number; isInverted: boolean; isLowContrast: boolean } {
  const lumFg = getRelativeLuminance(fgHex);
  const lumBg = getRelativeLuminance(bgHex);

  const l1 = Math.max(lumFg, lumBg);
  const l2 = Math.min(lumFg, lumBg);
  const ratio = Number(((l1 + 0.05) / (l2 + 0.05)).toFixed(2));

  const isInverted = lumFg > lumBg; // Foreground lighter than background
  const isLowContrast = ratio < 4.5;

  return { ratio, isInverted, isLowContrast };
}

