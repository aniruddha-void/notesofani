'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingState from '../../../../components/ui/LoadingState';
import ErrorState from '../../../../components/ui/ErrorState';
import ResourceTypeBadge from '../../../../components/ui/ResourceTypeBadge';
import apiClient, { getFileUrl } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/AuthContext';

export default function PdfViewerPage({ params }) {
  const { id } = params;
  const { user, loading: authLoading } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Blob URL state for authenticated PDF streaming
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // Password Protection state
  const [inputPassword, setInputPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    async function fetchResource() {
      try {
        setLoading(true);
        setError('');
        const res = await apiClient.get(`/resources/${id}`);
        if (res.data?.data?.resource) {
          const fetchedResource = res.data.data.resource;
          const rType = fetchedResource.resourceType || fetchedResource.type;
          if (rType !== 'PDF' && rType !== 'PYQ') {
            setError('This resource is not a PDF or PYQ document.');
          } else {
            setResource(fetchedResource);
          }
        } else {
          setError('Resource not found or not published.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'PDF Document unavailable or restricted.');
      } finally {
        setLoading(false);
      }
    }
    fetchResource();
  }, [id]);

  // Fetch authenticated PDF binary blob once resource is available and unlocked
  useEffect(() => {
    let objectUrl = null;
    let active = true;

    async function loadPdfBlob() {
      if (!user || !resource || (resource.passwordProtected && !resource.isUnlocked)) {
        return;
      }

      try {
        setPdfLoading(true);
        setPdfError('');
        const res = await apiClient.get(`/resources/${id}/file`, { responseType: 'blob' });

        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          const text = await res.data.text();
          const json = JSON.parse(text);
          if (active) setPdfError(json.message || 'Failed to load PDF document.');
          return;
        }

        const blob = new Blob([res.data], { type: 'application/pdf' });
        objectUrl = window.URL.createObjectURL(blob);
        if (active) {
          setPdfBlobUrl(objectUrl);
        }
      } catch (err) {
        console.error('[PdfViewer] Fetch blob error:', err);
        if (active) {
          setPdfError(err.response?.data?.message || 'Failed to stream PDF document.');
        }
      } finally {
        if (active) setPdfLoading(false);
      }
    }

    loadPdfBlob();

    return () => {
      active = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, user, resource?.isUnlocked, resource?.passwordProtected]);

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

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await apiClient.post(`/resources/${id}/download`, {}, { responseType: 'blob' });

      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        if (json.data?.downloadUrl) {
          window.open(json.data.downloadUrl, '_blank');
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
    } catch (err) {
      console.error('[PdfViewer] Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col justify-between text-slate-200">
      {/* PDF Header Controls */}
      <header className="min-h-16 py-2 sm:py-0 bg-obsidian-900 border-b border-white/[0.06] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href={`/resources/${id}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
            Back
          </Link>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-2 sm:gap-3 truncate min-w-0">
            <h2 className="font-semibold text-white text-xs sm:text-sm truncate">
              {resource ? resource.title : 'Loading Document...'}
            </h2>
            {resource && <ResourceTypeBadge type={resource.type || resource.resourceType} />}
          </div>
        </div>

        {user && resource && resource.isUnlocked && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-sky-500/20"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              {downloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>
        )}
      </header>

      {/* Viewer Main Body */}
      <main className="flex-1 w-full bg-obsidian-950 p-4 sm:p-6 flex items-center justify-center">
        {authLoading || loading || pdfLoading ? (
          <LoadingState message="Preparing Document Reader..." />
        ) : !user ? (
          /* Sign in required Card when logged out */
          <div className="w-full max-w-md p-8 bg-obsidian-900/90 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Sign in required</h3>
              <p className="text-sm text-slate-400">
                Please sign in to your NotesofAni account before accessing this resource.
              </p>
            </div>
            <div className="w-full pt-2">
              <Link
                href={`/login?returnTo=${encodeURIComponent(`/resources/${id}/view`)}`}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : error || pdfError ? (
          <ErrorState
            title="PDF Document Unavailable"
            message={error || pdfError}
          />
        ) : resource && resource.passwordProtected && !resource.isUnlocked ? (
          /* Password Protection Card when locked */
          <div className="w-full max-w-md p-8 bg-obsidian-900/90 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">Protected PDF Resource</h3>
              <p className="text-sm text-slate-400">
                This document is password protected. Enter password to view the PDF.
              </p>
            </div>
            <form onSubmit={handleVerifyPassword} className="w-full space-y-3 pt-2">
              <div className="relative">
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 pr-10"
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
                {verifyingPassword ? 'Unlocking PDF...' : 'Unlock PDF'}
              </button>
            </form>
          </div>
        ) : !pdfBlobUrl ? (
          <ErrorState
            title="PDF File Missing"
            message="No uploaded PDF file attached to this resource."
          />
        ) : (
          <div className="w-full max-w-5xl h-[82vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900">
            <iframe
              src={pdfBlobUrl}
              title={resource.title}
              className="w-full h-full border-none"
            ></iframe>
          </div>
        )}
      </main>
    </div>
  );
}
