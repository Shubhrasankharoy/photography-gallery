'use client';

import React, { useState, useEffect } from 'react';
import { getShareService } from '@/lib/share/shareFactory';
import { RESOURCE_TYPES, VISIBILITY_TYPES, SHARE_STATUS } from '@/lib/share/shareConstants';
import QRCodeModal from './QRCodeModal';
import { ConfirmationDialog } from '../ConfirmationDialog';

export default function ShareManager({ 
  isOpen, 
  onClose, 
  resourceType = RESOURCE_TYPES.EVENT, 
  resourceId, 
  studioId, 
  createdBy, 
  resourceTitle = '' 
}) {
  const shareService = getShareService();

  const [shares, setShares] = useState([]);
  const [activeShare, setActiveShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrThumbnail, setQrThumbnail] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: null
  });

  // Settings form state
  const [visibility, setVisibility] = useState(VISIBILITY_TYPES.PUBLIC);
  const [password, setPassword] = useState('');
  const [expiryOption, setExpiryOption] = useState('never'); // never, 1h, 24h, 7d, 30d, custom
  const [customExpiry, setCustomExpiry] = useState('');
  const [maxAccessCount, setMaxAccessCount] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowFaceSearch, setAllowFaceSearch] = useState(true);

  const loadShares = React.useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    try {
      const list = await shareService.getSharesByResource(resourceType, resourceId);
      setShares(list);

      const active = list.find(s => s.status === SHARE_STATUS.ACTIVE);
      if (active) {
        setActiveShare(active);
        setVisibility(active.visibility || VISIBILITY_TYPES.PUBLIC);
        setPassword(active.password || '');
        setAllowDownload(active.allowDownload ?? true);
        setAllowFaceSearch(active.allowFaceSearch ?? true);
        setMaxAccessCount(active.maxAccessCount ? String(active.maxAccessCount) : '');
        
        if (active.expiresAt) {
          setExpiryOption('custom');
          const d = new Date(active.expiresAt);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISODate = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setCustomExpiry(localISODate);
        } else {
          setExpiryOption('never');
        }

        shareService.generateQRCodePNG(active.token, { size: 128 }).then(setQrThumbnail);
      } else {
        setActiveShare(null);
        setQrThumbnail('');
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoading(false);
    }
  }, [resourceId, resourceType, shareService]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      const timer = setTimeout(() => {
        if (isMounted) loadShares();
      }, 0);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [isOpen, loadShares]);

  if (!isOpen) return null;

  const calculateExpiresAt = () => {
    if (expiryOption === 'never') return null;
    const now = new Date();
    if (expiryOption === '1h') return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    if (expiryOption === '24h') return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    if (expiryOption === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (expiryOption === '30d') return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (expiryOption === 'custom') {
      if (customExpiry) return new Date(customExpiry).toISOString();
      if (activeShare?.expiresAt) return new Date(activeShare.expiresAt).toISOString();
    }
    return null;
  };

  const handleCreateShare = async () => {
    setSaving(true);
    try {
      const expiresAt = calculateExpiresAt();
      await shareService.createShare({
        resourceType,
        resourceId,
        studioId,
        createdBy,
        title: resourceTitle,
        visibility,
        password: visibility === VISIBILITY_TYPES.PASSWORD ? password : null,
        expiresAt,
        maxAccessCount: maxAccessCount ? parseInt(maxAccessCount, 10) : null,
        allowDownload,
        allowFaceSearch
      });
      await loadShares();
    } catch (err) {
      console.error('Failed to create share link:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!activeShare) return;
    setSaving(true);
    try {
      const expiresAt = calculateExpiresAt();
      await shareService.updateShare(activeShare.shareId, {
        visibility,
        password: visibility === VISIBILITY_TYPES.PASSWORD ? password : null,
        expiresAt,
        maxAccessCount: maxAccessCount ? parseInt(maxAccessCount, 10) : null,
        allowDownload,
        allowFaceSearch
      });
      await loadShares();
    } catch (err) {
      console.error('Failed to update share settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRotateToken = () => {
    if (!activeShare) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Rotate Link Token?',
      description: 'Rotating this token will immediately invalidate the old link. Visitors will no longer be able to use the old URL. Continue?',
      confirmText: 'Rotate Link',
      onConfirm: async () => {
        setSaving(true);
        try {
          await shareService.rotateToken(activeShare.shareId);
          await loadShares();
        } catch (err) {
          console.error('Failed to rotate token:', err);
        } finally {
          setSaving(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleRevokeShare = () => {
    if (!activeShare) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Revoke Share Link?',
      description: 'Are you sure you want to revoke this share link? Visitors will no longer have access to this resource.',
      confirmText: 'Revoke Link',
      onConfirm: async () => {
        setSaving(true);
        try {
          await shareService.revokeShare(activeShare.shareId);
          await loadShares();
        } catch (err) {
          console.error('Failed to revoke share link:', err);
        } finally {
          setSaving(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleCopyLink = async () => {
    if (!activeShare) return;
    const success = await shareService.copyShareLink(activeShare.token);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = activeShare ? shareService.getShareUrl(activeShare.token) : '';

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-[#202020] border border-zinc-800/40 rounded-[24px] max-w-2xl w-full p-6 text-white shadow-2xl relative my-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-[#D4AF37] text-xl p-1 transition-colors"
            aria-label="Close Share Manager"
          >
            ✕
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight font-headline">Sharing System</h2>
            <p className="text-sm text-[#8E8E8E] font-light mt-0.5">
              Manage public access, permissions, QR codes, and link expiration for <span className="text-[#D4AF37] font-bold">{resourceTitle || resourceType}</span>.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-400 font-light">Loading share settings...</div>
          ) : activeShare ? (
            <div className="space-y-6">
              {/* Preview & Live Link Card */}
              <div className="p-4 bg-[#262626] border border-zinc-800/40 rounded-[20px] space-y-3 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                    {activeShare.status}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Visits: <strong className="text-white font-bold">{activeShare.accessCount || 0}</strong>
                    {activeShare.maxAccessCount ? ` / ${activeShare.maxAccessCount}` : ''}
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-zinc-400 block mb-1">Public Share URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="w-full bg-[#181818] border border-zinc-800/60 rounded-[12px] px-3 py-2 text-xs font-mono text-zinc-200 truncate focus:outline-hidden"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E0C55B] text-[#181818] text-xs font-bold rounded-[12px] shrink-0 transition-all duration-155"
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  {qrThumbnail && (
                    <button
                      onClick={() => setQrModalOpen(true)}
                      className="shrink-0 p-1.5 bg-white rounded-[12px] border border-zinc-200 hover:opacity-90 transition group relative"
                      title="View & Download QR Code"
                    >
                      <img src={qrThumbnail} alt="QR Thumbnail" className="w-12 h-12 object-contain" />
                      <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-[#181818] text-[9px] text-[#D4AF37] px-1.5 py-0.5 rounded border border-zinc-800/60 font-bold tracking-wider">
                        QR
                      </span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Expiry: {activeShare.expiresAt ? new Date(activeShare.expiresAt).toLocaleString() : 'Never'}
                  </span>
                  <span>Visibility: <strong className="text-[#D4AF37] capitalize font-bold">{activeShare.visibility}</strong></span>
                </div>
              </div>

              {/* Settings Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-300 font-headline">Access Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Visibility Mode</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full bg-[#181818] border border-zinc-800/60 rounded-[12px] px-3 py-2 text-sm text-zinc-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    >
                      <option value={VISIBILITY_TYPES.PUBLIC}>Public (Anyone with link)</option>
                      <option value={VISIBILITY_TYPES.PASSWORD}>Password Protected</option>
                    </select>
                  </div>

                  {visibility === VISIBILITY_TYPES.PASSWORD && (
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 block mb-1">Access Password</label>
                      <input
                        type="password"
                        placeholder="Enter access password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#181818] border border-zinc-800/60 rounded-[12px] px-3 py-2 text-sm text-zinc-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Link Expiration</label>
                    <select
                      value={expiryOption}
                      onChange={(e) => setExpiryOption(e.target.value)}
                      className="w-full bg-[#181818] border border-zinc-800/60 rounded-[12px] px-3 py-2 text-sm text-zinc-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    >
                      <option value="never">Never Expires</option>
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="custom">Specific Date & Time</option>
                    </select>
                  </div>

                  {expiryOption === 'custom' && (
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 block mb-1">Expiration Date</label>
                      <input
                        type="datetime-local"
                        value={customExpiry}
                        onChange={(e) => setCustomExpiry(e.target.value)}
                        className="w-full bg-[#181818] border border-zinc-800/60 rounded-[12px] px-3 py-2 text-sm text-zinc-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Max Access Limit (Optional)</label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      min="1"
                      value={maxAccessCount}
                      onChange={(e) => setMaxAccessCount(e.target.value)}
                      className="w-full bg-[#181818] border border-zinc-800/60 rounded-[12px] px-3 py-2 text-sm text-zinc-200 focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800/60 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={handleRotateToken}
                    disabled={saving}
                    className="px-3 py-2 bg-[#262626] hover:bg-[#2D2D2D] text-zinc-200 text-xs font-semibold rounded-[12px] border border-zinc-800/60 transition-all duration-150"
                  >
                    Rotate Token
                  </button>

                  <button
                    onClick={handleRevokeShare}
                    disabled={saving}
                    className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-350 text-xs font-semibold rounded-[12px] border border-rose-900/20 transition-all duration-150"
                  >
                    Revoke Share
                  </button>
                </div>

                <button
                  onClick={handleUpdateSettings}
                  disabled={saving}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#E0C55B] text-[#181818] text-xs font-bold rounded-[12px] transition-all duration-150"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-[#262626] border border-zinc-800/60 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto text-xl shadow-[var(--shadow-soft)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-100 font-headline">No Active Share Link</h3>
              <p className="text-xs text-[#8E8E8E] font-light max-w-sm mx-auto leading-relaxed">
                Create a secure, trackable public link with QR codes and expiration options for this resource.
              </p>
              <button
                onClick={handleCreateShare}
                disabled={saving}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#E0C55B] text-[#181818] font-bold text-sm rounded-[12px] shadow-lg transition-all duration-150"
              >
                {saving ? 'Creating Share Link...' : 'Create Share Link'}
              </button>
            </div>
          )}
        </div>
      </div>

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        token={activeShare?.token}
        shareTitle={resourceTitle}
        shareService={shareService}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        loading={saving}
        variant="danger"
      />
    </>
  );
}
