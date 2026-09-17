'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import LoadingState from '../../components/ui/LoadingState';
import ResourceTypeBadge from '../../components/ui/ResourceTypeBadge';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/ui/UserAvatar';

export default function ProfilePage() {
  const { user, loading, logoutUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (user) {
        try {
          setDashLoading(true);
          const res = await apiClient.get('/user/dashboard');
          if (res.data?.data) {
            setDashboard(res.data.data);
          }
        } catch (err) {
          console.error('[ProfilePage] Dashboard fetch error:', err);
        } finally {
          setDashLoading(false);
        }
      }
    }
    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="pt-28 pb-16 px-6 max-w-4xl mx-auto">
          <LoadingState message="Loading your profile..." />
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
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-slate-400 text-sm mb-6">Please sign in with Google to view your profile.</p>
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

      <main className="w-full pt-28 pb-16 px-6 sm:px-8 max-w-4xl mx-auto">
        <div className="bg-obsidian-800/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
          {/* Profile Header */}
          <div className="flex items-center gap-6 pb-8 border-b border-white/[0.06] mb-8">
            <UserAvatar
              src={user.avatarUrl}
              name={user.name}
              className="w-20 h-20 text-2xl border-2 border-sky-500/30"
            />
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-1">
                Google Authenticated
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Learning Overview */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Your Learning Overview
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="p-4 sm:p-5 rounded-xl bg-obsidian-900/70 border border-white/[0.06] flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {dashboard?.stats?.viewed ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">Viewed</span>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-obsidian-900/70 border border-white/[0.06] flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {dashboard?.stats?.downloads ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">Downloads</span>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-obsidian-900/70 border border-white/[0.06] flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  {dashboard?.stats?.favorites ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">Favorites</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Link
              href="/favorites"
              className="p-5 rounded-xl bg-obsidian-900/60 border border-white/[0.06] hover:border-rose-500/30 transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">favorite</span>
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-rose-400 transition-colors">
                  My Favorites
                </h4>
                <p className="text-xs text-slate-400">View saved study materials</p>
              </div>
            </Link>

            <Link
              href="/downloads"
              className="p-5 rounded-xl bg-obsidian-900/60 border border-white/[0.06] hover:border-sky-500/30 transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                  Download History
                </h4>
                <p className="text-xs text-slate-400">Track downloaded files</p>
              </div>
            </Link>
          </div>

          {/* Recently Viewed */}
          <div className="mb-8 pt-8 border-t border-white/[0.06]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Recently Viewed
            </h3>

            {dashLoading ? (
              <div className="p-6 rounded-xl bg-obsidian-900/50 border border-white/[0.04] text-center text-slate-400 text-xs">
                Loading recent activity...
              </div>
            ) : !dashboard?.recentlyViewed || dashboard.recentlyViewed.length === 0 ? (
              <div className="p-6 rounded-xl bg-obsidian-900/50 border border-white/[0.04] text-center">
                <p className="text-white font-medium text-sm mb-1">No recently viewed resources yet.</p>
                <p className="text-slate-400 text-xs">Open a study material to start building your history.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentlyViewed.map((item) => {
                  const res = item.resource;
                  if (!res) return null;
                  const resType = res.resourceType || res.type;
                  return (
                    <Link
                      key={item._id}
                      href={`/resources/${res._id}`}
                      className="p-4 rounded-xl bg-obsidian-900/60 border border-white/[0.06] hover:border-sky-500/30 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">
                            {resType === 'PDF' ? 'picture_as_pdf' : resType === 'Video' ? 'play_circle' : resType === 'PYQ' ? 'quiz' : 'link'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-sky-400 transition-colors">
                            {res.title}
                          </h4>
                          {res.subject && (
                            <p className="text-xs text-sky-400 font-medium truncate">
                              {res.subject.name}{res.subject.code ? ` (${res.subject.code})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ResourceTypeBadge type={resType} />
                        <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sign Out */}
          <div className="pt-6 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={logoutUser}
              className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-sm transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
