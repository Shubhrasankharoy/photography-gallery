'use client';

import React, { useState, useEffect } from 'react';

export default function QRCodeModal({ isOpen, onClose, token, shareTitle, shareService }) {
  const [pngUrl, setPngUrl] = useState('');
  const [svgString, setSvgString] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && token && shareService) {
      const svg = shareService.generateQRCodeSVG(token, { size: 300 });
      shareService.generateQRCodePNG(token, { size: 300 }).then(url => {
        if (!isMounted) return;
        setSvgString(svg);
        setPngUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, token, shareService]);

  if (!isOpen) return null;

  const shareUrl = shareService ? shareService.getShareUrl(token) : '';

  const handleDownloadPNG = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `qr-code-${token.substring(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${token.substring(0, 8)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyImage = async () => {
    try {
      if (!pngUrl || !navigator.clipboard || !window.ClipboardItem) return;
      const res = await fetch(pngUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy QR image to clipboard', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-1"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-1">QR Code</h3>
        <p className="text-sm text-slate-400 mb-6 truncate">{shareTitle || 'Public Share Link'}</p>

        <div className="flex flex-col items-center justify-center bg-white p-6 rounded-lg mb-6 shadow-inner">
          {pngUrl ? (
            <img src={pngUrl} alt="QR Code" className="w-56 h-56 object-contain" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-500">
              Generating QR...
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3 break-all text-center max-w-xs">{shareUrl}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownloadPNG}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Download PNG
          </button>
          <button
            onClick={handleDownloadSVG}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Download SVG
          </button>
          <button
            onClick={handleCopyImage}
            className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
          >
            {copied ? 'Copied!' : 'Copy Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
