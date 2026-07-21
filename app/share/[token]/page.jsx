'use client';

import React, { useState, useEffect, use } from 'react';
import { getShareService } from '@/lib/share/shareFactory';
import ResourceResolver from './resolvers/ResourceResolver';

export default function PublicSharePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const token = params?.token;

  const shareService = getShareService();

  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const attemptAccess = async (password = null) => {
    if (!token) return;
    try {
      setLoading(true);
      setPasswordError('');
      const res = await shareService.validateAndAccessShare(token, { password });
      setAccessState(res);
      if (!res.isValid && res.code === 'INVALID_PASSWORD') {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error('Public share access error:', err);
      setAccessState({
        isValid: false,
        code: 'ERROR',
        message: 'This shared link is invalid or no longer available.'
      });
    } finally {
      setLoading(false);
      setSubmittingPassword(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    const timer = setTimeout(() => {
      if (!isMounted) return;
      setLoading(true);
      setPasswordError('');
      shareService.validateAndAccessShare(token, { password: null })
        .then(res => {
          if (!isMounted) return;
          setAccessState(res);
          if (!res.isValid && res.code === 'INVALID_PASSWORD') {
            setPasswordError('Incorrect password. Please try again.');
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error('Public share access error:', err);
          setAccessState({
            isValid: false,
            code: 'ERROR',
            message: 'This shared link is invalid or no longer available.'
          });
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [token, shareService]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordInput) return;
    setSubmittingPassword(true);
    attemptAccess(passwordInput);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Verifying secure share link...</p>
        </div>
      </div>
    );
  }

  // Uniform generic security error view for invalid, expired, revoked, or non-existent tokens
  if (!accessState || (!accessState.isValid && !accessState.requiresPassword)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-950/50 border border-rose-800/60 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-100">Link Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This shared link is invalid, expired, or has been revoked by the owner. Please contact the photographer or studio for a new share link.
          </p>
        </div>
      </div>
    );
  }

  // Password Prompt View
  if (accessState.requiresPassword && !accessState.isValid) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-lg">
              🔒
            </div>
            <h2 className="text-xl font-bold text-white">Protected Link</h2>
            <p className="text-xs text-slate-400">
              This shared gallery is password protected. Enter the password below to access the contents.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-400 mt-1.5">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg"
            >
              {submittingPassword ? 'Verifying...' : 'Access Shared Gallery'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authorized Access View
  return (
    <ResourceResolver
      share={accessState.share}
      studioId={accessState.studioId}
      resourceId={accessState.resourceId}
      resourceType={accessState.resourceType}
    />
  );
}
