'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import LoadingState from '../../../components/ui/LoadingState';
import EmptyState from '../../../components/ui/EmptyState';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function AdminContactMessagesPage() {
  const { admin, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [activeStatus, setActiveStatus] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  
  const [viewMessage, setViewMessage] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

 
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = useCallback(async (statusFilter = 'All', searchQuery = '') => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await apiClient.get('/admin/contact-messages', { params });
      if (res.data?.data) {
        setMessages(res.data.data.messages || []);
        setPagination(res.data.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (err) {
      console.error('[AdminContactMessages] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      const timer = setTimeout(() => {
        fetchMessages(activeStatus, searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [admin, activeStatus, searchTerm, fetchMessages]);

  const handleOpenView = (msg) => {
    setViewMessage(msg);
    setIsViewModalOpen(true);
   
    if (msg.status === 'Unread' || msg.status === 'UNREAD') {
      handleUpdateStatus(msg._id, 'Read', false);
    }
  };

  const handleCloseView = () => {
    setIsViewModalOpen(false);
    setViewMessage(null);
  };

  const handleUpdateStatus = async (messageId, newStatus, showLoading = true) => {
    if (showLoading) setStatusUpdating(true);
    try {
      const res = await apiClient.patch(`/admin/contact-messages/${messageId}/status`, {
        status: newStatus,
      });
      if (res.data?.data?.message) {
        const updated = res.data.data.message;
        setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));
        if (viewMessage && viewMessage._id === messageId) {
          setViewMessage(updated);
        }
      }
    } catch (err) {
      console.error('[AdminContactMessages] Update status error:', err);
    } finally {
      if (showLoading) setStatusUpdating(false);
    }
  };

  const handleOpenDelete = (msg) => {
    setDeleteTarget(msg);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/admin/contact-messages/${deleteTarget._id}`);
      if (res.data?.status === 'success') {
        setMessages((prev) => prev.filter((m) => m._id !== deleteTarget._id));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        if (viewMessage && viewMessage._id === deleteTarget._id) {
          handleCloseView();
        }
        handleCloseDelete();
      }
    } catch (err) {
      console.error('[AdminContactMessages] Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDeleteModalOpen) handleCloseDelete();
        else if (isViewModalOpen) handleCloseView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewModalOpen, isDeleteModalOpen]);

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

  const statusBadge = (st) => {
    const norm = (st || '').toUpperCase();
    if (norm === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Resolved
        </span>
      );
    }
    if (norm === 'READ' || norm === 'REPLIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Read
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Unread
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex text-slate-200">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Contact Messages</h1>
              <p className="text-slate-400 text-sm mt-1">
                View and manage messages submitted by NotesofAni users.
              </p>
            </div>

           
            <div className="self-start md:self-auto px-4 py-2 bg-obsidian-900 border border-white/10 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400 text-[20px]">mail</span>
              <span className="text-xs text-slate-400 font-medium">Total Messages:</span>
              <span className="text-sm font-bold text-white">{pagination.total}</span>
            </div>
          </div>

          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
       
            <div className="flex items-center gap-2 p-1 bg-obsidian-900 border border-white/[0.06] rounded-xl self-start">
              {['All', 'Unread', 'Read', 'Resolved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveStatus(tab)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeStatus === tab
                      ? 'bg-sky-500 text-obsidian-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative max-w-md w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-obsidian-900 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingState message="Fetching contact messages..." />
          ) : messages.length === 0 ? (
            searchTerm.trim() || activeStatus !== 'All' ? (
              <EmptyState
                icon="mark_email_unread"
                title="No messages found."
                description="No messages matched your current filter or search criteria."
              />
            ) : (
              <EmptyState
                icon="mail"
                title="No contact messages yet."
                description="Messages submitted through the contact form will appear here."
              />
            )
          ) : (
            <div className="bg-obsidian-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-obsidian-950/80 text-xs font-semibold text-slate-400 uppercase border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4">Sender</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Message Snippet</th>
                      <th className="px-6 py-4">Submitted Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {messages.map((m) => {
                      const submittedDate = m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A';

                      return (
                        <tr
                          key={m._id}
                          onClick={() => handleOpenView(m)}
                          className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white truncate max-w-[180px]">{m.name}</div>
                            <div className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{m.email}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-200 font-medium truncate max-w-[180px]">
                            {m.subject || 'General Inquiry'}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[220px]">
                            {m.message}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{submittedDate}</td>
                          <td className="px-6 py-4">{statusBadge(m.status)}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenView(m);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition-all border border-sky-500/20"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDelete(m);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all border border-rose-500/20"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {isViewModalOpen && viewMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={handleCloseView}
        >
          <div
            className="bg-obsidian-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
           
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[22px]">mail</span>
                Contact Message
              </h3>
              <button
                onClick={handleCloseView}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

          
            <div className="p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sender Info</span>
                {statusBadge(viewMessage.status)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Name:</span>
                  <span className="font-semibold text-white">{viewMessage.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Email:</span>
                  <span className="font-mono text-slate-300 text-xs">{viewMessage.email}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 block">Subject:</span>
                  <span className="font-medium text-sky-400">{viewMessage.subject || 'General Inquiry'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 block">Submitted Date:</span>
                  <span className="text-xs text-slate-400">
                    {viewMessage.createdAt
                      ? new Date(viewMessage.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Message Body</h4>
              <div className="p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] text-slate-200 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {viewMessage.message}
              </div>
            </div>

           
            <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {(viewMessage.status || '').toUpperCase() !== 'READ' && (
                  <button
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(viewMessage._id, 'Read')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all border border-slate-700 disabled:opacity-50"
                  >
                    Mark as Read
                  </button>
                )}
                {(viewMessage.status || '').toUpperCase() !== 'RESOLVED' && (
                  <button
                    disabled={statusUpdating}
                    onClick={() => handleUpdateStatus(viewMessage._id, 'Resolved')}
                    className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium rounded-xl transition-all border border-emerald-500/30 disabled:opacity-50"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>

              <button
                onClick={handleCloseView}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

     
      {isDeleteModalOpen && deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={handleCloseDelete}
        >
          <div
            className="bg-obsidian-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <span className="material-symbols-outlined text-[24px]">delete_forever</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Delete Contact Message?</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete the message from{' '}
              <strong className="text-white">{deleteTarget.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button
                disabled={deleting}
                onClick={handleCloseDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
