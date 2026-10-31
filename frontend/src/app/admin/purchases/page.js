'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import Toast from '../../../components/ui/Toast';
import LoadingState from '../../../components/ui/LoadingState';
import EmptyState from '../../../components/ui/EmptyState';
import UserAvatar from '../../../components/ui/UserAvatar';
import ResourceTypeBadge from '../../../components/ui/ResourceTypeBadge';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function AdminPurchasesPage() {
  const { admin } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Modal review state
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await apiClient.get('/admin/purchases', { params });
      if (res.data?.status === 'success') {
        setPurchases(res.data.data.purchases || []);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('[AdminPurchases] Fetch error:', err);
      setToast({ visible: true, message: 'Failed to load purchase requests.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchPurchases();
    }
  }, [admin, statusFilter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPurchases();
  };

  const handleApprove = async (purchaseId) => {
    try {
      setActionLoading(true);
      const res = await apiClient.patch(`/admin/purchases/${purchaseId}/approve`);
      if (res.data?.status === 'success') {
        setToast({ visible: true, message: 'Purchase request approved successfully!', type: 'success' });
        setSelectedPurchase(null);
        fetchPurchases();
      }
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to approve purchase request.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (purchaseId) => {
    try {
      setActionLoading(true);
      const res = await apiClient.patch(`/admin/purchases/${purchaseId}/reject`, {
        reason: rejectReason.trim(),
      });
      if (res.data?.status === 'success') {
        setToast({ visible: true, message: 'Purchase request rejected.', type: 'info' });
        setSelectedPurchase(null);
        setShowRejectInput(false);
        setRejectReason('');
        fetchPurchases();
      }
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to reject purchase request.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <Link href="/admin/login" className="px-5 py-2.5 bg-sky-500 text-obsidian-950 font-bold rounded-xl text-sm">
          Admin Login Required
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col md:flex-row text-slate-200">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sky-400 text-[24px]">receipt_long</span>
                <span className="text-xs font-mono text-sky-400 uppercase tracking-wider">Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Purchase Requests</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Manually verify PhonePe/UPI payments and grant access to premium study resources.
              </p>
            </div>

            <Link
              href="/admin/payment-settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 hover:border-sky-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-400">qr_code_2</span>
              Payment Settings
            </Link>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-obsidian-900/60 border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: 'all', label: 'All Requests' },
                { key: 'pending', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === tab.key
                      ? 'bg-sky-500 text-obsidian-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 min-w-[260px]">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ref ID, user, title..."
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/50"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Requests Content */}
          {loading ? (
            <LoadingState message="Loading purchase requests..." />
          ) : purchases.length === 0 ? (
            <EmptyState
              title="No Purchase Requests"
              message={
                search || statusFilter !== 'all'
                  ? 'No purchase requests matched your search filters.'
                  : 'No students have submitted UPI purchase requests yet.'
              }
            />
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const isPending = purchase.status === 'pending';
                const isApproved = purchase.status === 'approved';
                const isRejected = purchase.status === 'rejected';

                return (
                  <div
                    key={purchase._id}
                    className="bg-obsidian-900 border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: User & Resource */}
                    <div className="flex items-start gap-3 min-w-0">
                      <UserAvatar
                        src={purchase.user?.avatarUrl || purchase.user?.profileImage}
                        name={purchase.user?.name}
                        className="w-10 h-10 text-sm border border-white/10 shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-white text-sm truncate">{purchase.user?.name || 'Anonymous User'}</h4>
                          <span className="text-xs text-slate-400 truncate">({purchase.user?.email})</span>
                        </div>
                        <p className="text-xs font-semibold text-sky-400 line-clamp-1 mb-1">
                          {purchase.resource?.title || 'Unknown Resource'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Date: {new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>Time: {new Date(purchase.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Amount & Transaction Reference */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-obsidian-950/70 border border-white/[0.04] px-4 py-2.5 rounded-xl shrink-0">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount</span>
                        <span className="text-base font-extrabold text-white">₹{purchase.amount}</span>
                      </div>
                      <div className="h-7 w-px bg-white/10 hidden sm:block" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI Reference / UTR</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-amber-400">{purchase.transactionId}</span>
                          <button
                            onClick={() => copyToClipboard(purchase.transactionId, purchase._id)}
                            className="text-slate-400 hover:text-white p-0.5 transition-colors"
                            title="Copy Reference ID"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {copiedId === purchase._id ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t border-white/[0.04] lg:border-t-0 shrink-0">
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending Verification
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            Rejected
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowRejectInput(false);
                            setRejectReason('');
                          }}
                          className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Details
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApprove(purchase._id)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowRejectInput(true);
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 text-xs text-slate-400">
                  <span>
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total requests)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      className="px-3 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 hover:bg-white/[0.04] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="px-3 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 hover:bg-white/[0.04] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Purchase Review Modal */}
        {selectedPurchase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-obsidian-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-[22px]">verified</span>
                  <h3 className="font-bold text-white text-lg">Review Purchase Request</h3>
                </div>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Request Info Cards */}
              <div className="bg-obsidian-950/80 border border-white/[0.06] rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">Resource:</span>
                  <span className="font-bold text-white text-right max-w-xs truncate">
                    {selectedPurchase.resource?.title}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">Price Amount:</span>
                  <span className="font-extrabold text-sky-400 text-sm">
                    ₹{selectedPurchase.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">User:</span>
                  <span className="text-white text-right">
                    {selectedPurchase.user?.name} ({selectedPurchase.user?.email})
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">UPI Ref / UTR:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {selectedPurchase.transactionId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedPurchase.transactionId, 'modal')}
                      className="text-slate-400 hover:text-white"
                      title="Copy Reference ID"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedId === 'modal' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">Submission Date:</span>
                  <span className="text-slate-300">
                    {new Date(selectedPurchase.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-white capitalize">{selectedPurchase.status}</span>
                </div>

                {selectedPurchase.paymentNote && (
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-slate-400 block mb-1">Student Note:</span>
                    <p className="bg-obsidian-900 p-2.5 rounded-lg text-slate-300 italic">
                      "{selectedPurchase.paymentNote}"
                    </p>
                  </div>
                )}
              </div>

              {/* Warning for Admin */}
              {selectedPurchase.status === 'pending' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-400 text-[20px] shrink-0 mt-0.5">
                    warning
                  </span>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    <strong>Manual Bank Check Required:</strong> Check your PhonePe/Bank transaction history to confirm that <strong>₹{selectedPurchase.amount}</strong> was received with UTR/Ref <code>{selectedPurchase.transactionId}</code> before clicking approve.
                  </p>
                </div>
              )}

              {/* Optional Reject Reason Input */}
              {showRejectInput && selectedPurchase.status === 'pending' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-rose-400">
                    Reason for Rejection (Optional)
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Transaction reference not found in bank statement"
                    className="w-full bg-obsidian-950 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>

                {selectedPurchase.status === 'pending' && (
                  <>
                    {!showRejectInput ? (
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleReject(selectedPurchase._id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                      >
                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedPurchase._id)}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {actionLoading ? 'Approving...' : 'Confirm & Approve Payment'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
