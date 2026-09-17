'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import ResourceTypeBadge from '../../../components/ui/ResourceTypeBadge';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingState from '../../../components/ui/LoadingState';
import Toast from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function ManageResourcesPage() {
  const { admin } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Custom Delete Confirmation Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Fetch all resources for admin (both Published and Draft)
      const res = await apiClient.get('/admin/resources?limit=50');
      if (res.data?.data?.resources) {
        setResources(res.data.data.resources);
      }
    } catch (err) {
      console.error('[ManageResources] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchResources();
  }, [admin]);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
    try {
      await apiClient.patch(`/resources/${id}/status`, { status: nextStatus });
      setToast({ visible: true, message: `Resource status changed to ${nextStatus}`, type: 'success' });
      fetchResources();
    } catch (err) {
      setToast({ visible: true, message: 'Failed to update status', type: 'error' });
    }
  };

  const openDeleteModal = (resource) => {
    setResourceToDelete(resource);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setResourceToDelete(null);
  };

  const confirmDeleteResource = async () => {
    if (!resourceToDelete || deleting) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/resources/${resourceToDelete._id}`);
      setToast({ visible: true, message: 'Resource deleted successfully', type: 'success' });
      setResources((prev) => prev.filter((r) => r._id !== resourceToDelete._id));
      setDeleteModalOpen(false);
      setResourceToDelete(null);
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to delete resource. Please try again.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-6">
        <Link href="/admin/login" className="px-5 py-2.5 bg-sky-500 text-obsidian-950 font-bold rounded-xl">
          Admin Login Required
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex text-slate-200">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Manage Resources</h1>
              <p className="text-slate-400 text-sm">Create, edit, publish, or delete study materials</p>
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
            <LoadingState message="Loading resource table..." />
          ) : resources.length === 0 ? (
            <div className="bg-obsidian-900 border border-white/10 p-12 rounded-2xl text-center text-slate-400">
              No resources found. Click "Add Resource" to create one.
            </div>
          ) : (
            <div className="bg-obsidian-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-obsidian-950 text-xs font-semibold uppercase text-slate-400 border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Protection</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {resources.map((res) => (
                      <tr key={res._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-white max-w-xs truncate">
                          {res.title}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-sky-400">
                          {res.subject?.name || 'General'}
                        </td>
                        <td className="px-6 py-4">
                          <ResourceTypeBadge type={res.type} />
                        </td>
                        <td className="px-6 py-4">
                          {res.passwordProtected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="material-symbols-outlined text-[14px]">lock</span>
                              Protected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="material-symbols-outlined text-[14px]">lock_open</span>
                              Public
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(res._id, res.status)}
                            title="Click to toggle Draft / Published"
                          >
                            <StatusBadge status={res.status} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link
                            href={`/admin/resources/${res._id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(res)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Professional In-App Delete Confirmation Modal */}
        <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white tracking-tight">Delete Resource?</h3>
              <p className="text-sm text-slate-300">
                Are you sure you want to delete <span className="font-semibold text-white">"{resourceToDelete?.title}"</span>?
              </p>
              <p className="text-xs text-rose-400/90 font-medium">This action cannot be undone.</p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteResource}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-sm font-bold transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  'Delete Resource'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
