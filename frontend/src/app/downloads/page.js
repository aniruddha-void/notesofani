'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ResourceTypeBadge from '../../components/ui/ResourceTypeBadge';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';

export default function DownloadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDownloads() {
      if (user) {
        try {
          setLoading(true);
          const res = await apiClient.get('/user/downloads');
          if (res.data?.data?.history) {
            setHistory(res.data.data.history);
          }
        } catch (err) {
          console.error('[DownloadsPage] Fetch error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchDownloads();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
          <LoadingState message="Loading download history..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="pt-28 pb-16 px-6 max-w-md mx-auto text-center">
          <div className="bg-obsidian-800/60 border border-white/[0.06] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400 text-sm mb-6">Please sign in to view your download history.</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
            >
              Sign In with Google
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="w-full pt-28 pb-16 px-6 sm:px-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Download History</h1>
          <p className="text-slate-400 text-sm">Keep track of resources you have downloaded or accessed.</p>
        </div>

        {loading ? (
          <LoadingState message="Fetching your download history..." />
        ) : history.length === 0 ? (
          <EmptyState
            icon="download_done"
            title="No Download History"
            description="You have not downloaded any study materials yet."
            action={
              <Link
                href="/resources"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
              >
                Browse Resources
              </Link>
            }
          />
        ) : (
          <div className="bg-obsidian-800/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-obsidian-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-4">Resource</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Downloaded At</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {history.map((item) => {
                    const res = item.resource;
                    if (!res) return null;
                    return (
                      <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/resources/${res._id}`} className="font-bold text-white hover:text-sky-400 transition-colors">
                            {res.title}
                          </Link>
                          {res.subject && (
                            <p className="text-xs text-sky-400 font-medium">
                              {res.subject.name}{res.subject.code ? ` (${res.subject.code})` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <ResourceTypeBadge type={res.type} />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {new Date(item.downloadedAt || item.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/resources/${res._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold transition-colors"
                          >
                            Re-open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
