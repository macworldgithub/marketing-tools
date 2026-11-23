// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import { formatWiFiPayload, getContrastRatio } from './index';

describe('QR Code Engine', () => {
  // Vector: SSID Home;Net, password p:ss\word, WPA → WIFI:T:WPA;S:Home\;Net;P:p\:ss\\word;;
  it('correctly formats specification Wi-Fi vector', () => {
    const payload = formatWiFiPayload({
      ssid: 'Home;Net',
      password: 'p:ss\\word',
      security: 'WPA',
    });

    expect(payload).toBe('WIFI:T:WPA;S:Home\\;Net;P:p\\:ss\\\\word;;');
  });

  it('omits password field when security is nopass', () => {
    const payload = formatWiFiPayload({
      ssid: 'PublicCoffee',
      security: 'nopass',
    });

    expect(payload).toBe('WIFI:T:nopass;S:PublicCoffee;;');
  });

  it('includes H:true; when network is hidden', () => {
    const payload = formatWiFiPayload({
      ssid: 'SecretNet',
      password: 'mypassword',
      security: 'WPA',
      hidden: true,
    });

    expect(payload).toBe('WIFI:T:WPA;S:SecretNet;P:mypassword;H:true;;');
  });

  it('detects inverted and low contrast combinations', () => {
    // Normal black on white
    const normal = getContrastRatio('#000000', '#ffffff');
    expect(normal.isInverted).toBe(false);
    expect(normal.isLowContrast).toBe(false);
    expect(normal.ratio).toBeGreaterThan(20);

    // Inverted white on black
    const inverted = getContrastRatio('#ffffff', '#000000');
    expect(inverted.isInverted).toBe(true);

    // Low contrast light grey on white
    const low = getContrastRatio('#cccccc', '#ffffff');
    expect(low.isLowContrast).toBe(true);
  });
});

