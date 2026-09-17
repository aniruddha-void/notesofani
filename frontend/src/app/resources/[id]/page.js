'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import ResourceTypeBadge from '../../../components/ui/ResourceTypeBadge';
import LoadingState from '../../../components/ui/LoadingState';
import ErrorState from '../../../components/ui/ErrorState';
import apiClient, { getFileUrl } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function ResourceDetailPage({ params }) {
  const { id } = params;
  const { user } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Password Protection & Authentication Modal state
  const [inputPassword, setInputPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    async function fetchResource() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/resources/${id}`);
        if (res.data?.data?.resource) {
          setResource(res.data.data.resource);
        }
      } catch (err) {
        setError('Resource not found or has not been published yet.');
      } finally {
        setLoading(false);
      }
    }
    fetchResource();
  }, [id]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!inputPassword) {
      setPasswordError('Please enter the password.');
      return;
    }
    try {
      setVerifyingPassword(true);
      setPasswordError('');
      const res = await apiClient.post(`/resources/${id}/verify-password`, { password: inputPassword });
      if (res.data?.status === 'success' && res.data?.data?.isUnlocked) {
        setResource((prev) => ({
          ...prev,
          isUnlocked: true,
          fileUrl: res.data.data.fileUrl || prev.fileUrl,
          externalUrl: res.data.data.externalUrl || prev.externalUrl,
        }));
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Record view activity for logged-in user
  useEffect(() => {
    async function recordUserView() {
      if (user && resource?._id && resource?.isUnlocked) {
        try {
          await apiClient.post(`/user/views/${resource._id}`);
        } catch (err) {
          // Non-blocking view tracking error
          console.error('[ResourceDetail] Record view error:', err);
        }
      }
    }
    recordUserView();
  }, [user, resource?._id, resource?.isUnlocked]);

  // Check if favorited by current user
  useEffect(() => {
    async function checkFavorite() {
      if (user && id) {
        try {
          const res = await apiClient.get('/user/favorites');
          if (res.data?.data?.favorites) {
            const favIds = res.data.data.favorites.map((f) => f.resource?._id || f.resource);
            setIsFavorited(favIds.includes(id));
          }
        } catch (err) {
          console.error('[ResourceDetail] Check favorite error:', err);
        }
      }
    }
    checkFavorite();
  }, [user, id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    try {
      if (isFavorited) {
        await apiClient.delete(`/user/favorites/${id}`);
        setIsFavorited(false);
      } else {
        await apiClient.post(`/user/favorites/${id}`);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('[ResourceDetail] Favorite error:', err);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    try {
      setDownloading(true);
      const res = await apiClient.post(`/resources/${id}/download`, {}, { responseType: 'blob' });

      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        if (json.data?.downloadUrl) {
          window.open(json.data.downloadUrl, '_blank');
          if (resource) {
            setResource((prev) => ({ ...prev, downloadsCount: (prev.downloadsCount || 0) + 1 }));
          }
        }
        return;
      }

      const disposition = res.headers['content-disposition'] || '';
      let fileName = `${resource?.title || 'resource'}.pdf`;
      if (disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const blob = new Blob([res.data], { type: contentType || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (resource) {
        setResource((prev) => ({ ...prev, downloadsCount: (prev.downloadsCount || 0) + 1 }));
      }
    } catch (err) {
      console.error('[ResourceDetail] Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="w-full pt-28 pb-16 px-6 sm:px-8 max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Resources
        </Link>

        {loading ? (
          <LoadingState message="Loading resource details..." />
        ) : error || !resource ? (
          <ErrorState message={error || 'Resource not found.'} />
        ) : (
          <div className="bg-obsidian-800/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
            {/* Header Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <ResourceTypeBadge type={resource.type} />
                {resource.passwordProtected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Protected Resource
                  </span>
                )}
              </div>
            </div>

            {/* Title & Subject */}
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
              {resource.title}
            </h1>
            {resource.subject && (
              <p className="text-sm font-semibold text-sky-400 mb-6">
                Subject: {resource.subject.name}{resource.subject.code ? ` (${resource.subject.code})` : ''}
              </p>
            )}

            {/* Description */}
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed mb-8">
              <p>{resource.description || 'No detailed description available for this study material.'}</p>
            </div>

            {/* Password Protection Card if locked */}
            {resource.passwordProtected && !resource.isUnlocked ? (
              <div className="my-8 p-8 bg-obsidian-950/80 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-[28px]">lock</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Protected Resource</h3>
                  <p className="text-sm text-slate-400 max-w-sm">
                    This resource is password protected. Enter password to continue.
                  </p>
                </div>
                <form onSubmit={handleVerifyPassword} className="w-full max-w-sm space-y-3 pt-2">
                  <div className="relative">
                    <input
                      type={showPasswordInput ? 'text' : 'password'}
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordInput(!showPasswordInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPasswordInput ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-rose-400 font-medium text-left">{passwordError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={verifyingPassword}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    {verifyingPassword ? 'Unlocking...' : 'Unlock Resource'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Video Embed Player if Video Type */}
                {resource.type === 'Video' && (resource.externalUrl || resource.embedVideoUrl) && (
                  <div className="mb-8 aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      src={
                        (resource.externalUrl || resource.embedVideoUrl).includes('youtube.com/watch?v=')
                          ? `https://www.youtube.com/embed/${(resource.externalUrl || resource.embedVideoUrl).split('v=')[1]?.split('&')[0]}`
                          : (resource.externalUrl || resource.embedVideoUrl).includes('youtu.be/')
                          ? `https://www.youtube.com/embed/${(resource.externalUrl || resource.embedVideoUrl).split('youtu.be/')[1]?.split('?')[0]}`
                          : (resource.embedVideoUrl || resource.externalUrl)
                      }
                      title={resource.title}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.06]">
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  isFavorited
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.06]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isFavorited ? 'favorite' : 'favorite_border'}
                </span>
                {isFavorited ? 'Favorited' : 'Add to Favorites'}
              </button>

              <div className="flex items-center gap-3">
                {/* PDF Actions */}
                {(resource.resourceType === 'PDF' || resource.type === 'PDF') && (
                  <>
                    <Link
                      href={`/resources/${resource._id}/view`}
                      onClick={(e) => {
                        if (!user) {
                          e.preventDefault();
                          setShowSignInModal(true);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                      View PDF
                    </Link>

                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      {downloading ? 'Processing...' : 'Download File'}
                    </button>
                  </>
                )}

                {/* PYQ Actions */}
                {(resource.resourceType === 'PYQ' || resource.type === 'PYQ') && (
                  <>
                    <Link
                      href={`/resources/${resource._id}/view`}
                      onClick={(e) => {
                        if (!user) {
                          e.preventDefault();
                          setShowSignInModal(true);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                      View PYQ
                    </Link>

                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      {downloading ? 'Processing...' : 'Download File'}
                    </button>
                  </>
                )}

                {/* Video Action */}
                {(resource.resourceType === 'Video' || resource.type === 'Video') && (
                  <a
                    href={user && resource.externalUrl ? resource.externalUrl : '#'}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowSignInModal(true);
                      }
                    }}
                    target={user && resource.externalUrl ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">play_circle</span>
                    Watch Video
                  </a>
                )}

                {/* Google Drive Action */}
                {(resource.resourceType === 'Google Drive' || resource.type === 'Google Drive') && (
                  <a
                    href={user && resource.externalUrl ? resource.externalUrl : '#'}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowSignInModal(true);
                      }
                    }}
                    target={user && resource.externalUrl ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    Open Google Drive
                  </a>
                )}

                {/* Useful Link Action */}
                {(resource.resourceType === 'Useful Link' || resource.type === 'Useful Link') && (
                  <a
                    href={user && resource.externalUrl ? resource.externalUrl : '#'}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowSignInModal(true);
                      }
                    }}
                    target={user && resource.externalUrl ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    Open Link
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sign in required Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-obsidian-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Sign in required</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Please sign in to your NotesofAni account before accessing this resource.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/login?returnTo=${encodeURIComponent(`/resources/${id}`)}`}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 inline-flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
