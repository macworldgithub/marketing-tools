'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { formatWiFiPayload } from '../engines/qr';
import { RotateCcw } from 'lucide-react';

export const Tool: React.FC = () => {
  const [ssid, setSsid] = useState<string>('Home-Network');
  const [password, setPassword] = useState<string>('SecretPassword123');
  const [authType, setAuthType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [hidden, setHidden] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [svgStr, setSvgStr] = useState<string>('');

  const handleReset = () => {
    setSsid('Home-Network');
    setPassword('SecretPassword123');
    setAuthType('WPA');
    setHidden(false);
  };

  useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  const payload = formatWiFiPayload({
    ssid,
    password: authType === 'nopass' ? undefined : password,
    security: authType,
    hidden,
  });

  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { width: 320, margin: 2 }).then(setQrUrl).catch(console.error);
    QRCode.toString(payload, { type: 'svg', width: 320, margin: 2 }).then(setSvgStr).catch(console.error);
  }, [payload]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi-${ssid || 'network'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[760px] mx-auto shadow-sm space-y-6">
      {/* Notice */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-400">
        <strong>Privacy Note:</strong> Generated 100% locally. The network password is contained in plain text inside the QR code for scanners to read.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Network Name (SSID)
            </label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
              placeholder="e.g. MyHomeWiFi"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Security Type
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md"
            >
              <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
              <option value="WEP">WEP (Legacy)</option>
              <option value="nopass">None (Open Network)</option>
            </select>
          </div>

          {authType !== 'nopass' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-md font-mono"
                placeholder="Wi-Fi Password"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="rounded"
            />
            <span>Hidden Network (SSID not broadcast)</span>
          </label>
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-3">
            {qrUrl ? (
              <img src={qrUrl} alt="Wi-Fi QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">Loading...</div>
            )}
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{ssid || 'Wi-Fi Network'}</div>
          <div className="text-xs text-slate-500 mb-4">Scan with camera to connect</div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <a
              href={qrUrl}
              download={`wifi-${ssid || 'qr'}.png`}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
            >
              Download PNG
            </a>
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Download SVG
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
            >
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};