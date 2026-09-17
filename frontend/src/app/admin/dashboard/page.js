'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import LoadingState from '../../../components/ui/LoadingState';
import ResourceTypeBadge from '../../../components/ui/ResourceTypeBadge';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function AdminDashboardPage() {
  const { admin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await apiClient.get('/admin/stats');
        if (res.data?.data?.stats) {
          setStats(res.data.data.stats);
        }
      } catch (err) {
        console.error('[AdminDashboard] Stats error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (admin) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [admin]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <LoadingState message="Verifying admin session..." />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-6 text-center">
        <div className="bg-obsidian-900 border border-white/10 p-8 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-400 text-sm mb-6">Please log in to access the administrator dashboard.</p>
          <Link
            href="/admin/login"
            className="inline-block px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex text-slate-200">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">Platform overview & live analytics</p>
            </div>
            <Link
              href="/admin/resources/new"
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Resource
            </Link>
          </div>

          {loading ? (
            <LoadingState message="Calculating real-time analytics..." />
          ) : !stats ? (
            <div className="bg-obsidian-900 border border-white/10 p-8 rounded-2xl text-center text-slate-400">
              Failed to load stats data.
            </div>
          ) : (
            <>
              {/* Primary Stat Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-obsidian-900 border border-white/[0.06] p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total Resources
                    </span>
                    <span className="material-symbols-outlined text-sky-400 text-[22px]">folder</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.totalResources}</span>
                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-3">
                    <span className="text-emerald-400">{stats.publishedResources} Published</span>
                    <span>•</span>
                    <span className="text-amber-400">{stats.draftResources} Drafts</span>
                  </div>
                </div>

                <div className="bg-obsidian-900 border border-white/[0.06] p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total Downloads
                    </span>
                    <span className="material-symbols-outlined text-sky-400 text-[22px]">download</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.totalDownloads}</span>
                  <p className="mt-2 text-xs text-slate-400">Across all published files</p>
                </div>

                <div className="bg-obsidian-900 border border-white/[0.06] p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      TOTAL USERS
                    </span>
                    <span className="material-symbols-outlined text-sky-400 text-[22px]">group</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
                  <p className="mt-2 text-xs text-slate-400">Google authenticated users</p>
                </div>

                <div className="bg-obsidian-900 border border-white/[0.06] p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Subjects
                    </span>
                    <span className="material-symbols-outlined text-sky-400 text-[22px]">menu_book</span>
                  </div>
                  <span className="text-3xl font-bold text-white">{stats.totalSubjects}</span>
                  <p className="mt-2 text-xs text-slate-400">Configured course subjects</p>
                </div>
              </div>

              {/* Resource Distribution by Official Types */}
              <div className="bg-obsidian-900 border border-white/[0.06] p-8 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-6">Resource Distribution by Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {Object.entries(stats.resourceDistribution || {}).map(([type, count]) => (
                    <div
                      key={type}
                      className="p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] text-center"
                    >
                      <div className="mb-2 flex justify-center">
                        <ResourceTypeBadge type={type} />
                      </div>
                      <span className="block text-2xl font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
