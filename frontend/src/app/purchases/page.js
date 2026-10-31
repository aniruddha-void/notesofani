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

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPurchases() {
      if (user) {
        try {
          setLoading(true);
          const res = await apiClient.get('/user/purchases');
          if (res.data?.data?.purchases) {
            setPurchases(res.data.data.purchases);
          }
        } catch (err) {
          console.error('[PurchasesPage] Fetch error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchPurchases();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
          <LoadingState message="Loading your purchases..." />
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
            <p className="text-slate-400 text-sm mb-6">Please sign in to view your purchase history.</p>
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

  const filteredPurchases = purchases.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const title = item.resource?.title || '';
    const utr = item.transactionId || '';
    const matchesSearch =
      !searchQuery.trim() ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      utr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = purchases.filter((p) => p.status === 'pending').length;
  const approvedCount = purchases.filter((p) => p.status === 'approved').length;
  const rejectedCount = purchases.filter((p) => p.status === 'rejected').length;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="w-full pt-20 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">My Purchases</h1>
            <p className="text-slate-400 text-sm">
              Track your premium resource orders, verification status, and access unlocked study materials.
            </p>
          </div>
          <Link
            href="/resources"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-semibold transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            Explore Resources
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-obsidian-800/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-sky-500 text-obsidian-950'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              All ({purchases.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === 'approved'
                  ? 'bg-emerald-500 text-obsidian-950'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-white/[0.04]'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-obsidian-950'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-white/[0.04]'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                statusFilter === 'rejected'
                  ? 'bg-rose-500 text-obsidian-950'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-white/[0.04]'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined text-[18px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource or UTR..."
              className="w-full bg-obsidian-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <LoadingState message="Fetching your purchases..." />
        ) : filteredPurchases.length === 0 ? (
          <EmptyState
            icon="shopping_bag"
            title={purchases.length === 0 ? 'No Purchases Found' : 'No Matching Purchases'}
            description={
              purchases.length === 0
                ? 'You have not submitted any purchase requests yet.'
                : 'No purchases matched your selected filter or search term.'
            }
            action={
              <Link
                href="/resources"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
              >
                Browse Premium Resources
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
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Transaction UTR</th>
                    <th className="px-6 py-4">Requested Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPurchases.map((purchase) => {
                    const res = purchase.resource;
                    if (!res) return null;
                    return (
                      <tr key={purchase._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/resources/${res._id}`}
                            className="font-bold text-white hover:text-sky-400 transition-colors line-clamp-1"
                          >
                            {res.title}
                          </Link>
                          {res.subject && (
                            <p className="text-xs text-sky-400 font-medium">
                              {res.subject.name}
                              {res.subject.code ? ` (${res.subject.code})` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-400 whitespace-nowrap">
                          ₹{purchase.amount} INR
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                          {purchase.transactionId}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                          {new Date(purchase.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {purchase.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              Approved
                            </span>
                          )}
                          {purchase.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              Pending Verification
                            </span>
                          )}
                          {purchase.status === 'rejected' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="material-symbols-outlined text-[13px]">cancel</span>
                                Rejected
                              </span>
                              {purchase.rejectionReason && (
                                <p className="text-[11px] text-rose-400/90 mt-1 max-w-xs truncate" title={purchase.rejectionReason}>
                                  {purchase.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {purchase.status === 'approved' ? (
                            <Link
                              href={`/resources/${res._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[15px]">lock_open</span>
                              Access Resource
                            </Link>
                          ) : purchase.status === 'pending' ? (
                            <span className="text-xs text-slate-400 italic">Under review</span>
                          ) : (
                            <span className="text-xs text-rose-400/80">Declined</span>
                          )}
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
