'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import Modal from '../../../components/ui/Modal';
import LoadingState from '../../../components/ui/LoadingState';
import Toast from '../../../components/ui/Toast';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function ManageSubjectsPage() {
  const { admin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editName, setEditName] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });


  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/subjects');
      if (res.data?.data?.subjects) {
        setSubjects(res.data.data.subjects);
      }
    } catch (err) {
      console.error('[ManageSubjects] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchSubjects();
  }, [admin]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      setToast({ visible: true, message: 'Subject name is required.', type: 'error' });
      return;
    }

    try {
      const res = await apiClient.post('/subjects', { name: formData.name.trim() });
      if (res.data?.status === 'success') {
        setToast({ visible: true, message: 'Subject created successfully!', type: 'success' });
        setIsModalOpen(false);
        setFormData({ name: '' });
        fetchSubjects();
      }
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to create subject.',
        type: 'error',
      });
    }
  };

  const handleOpenEditModal = (subject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editName || !editName.trim()) {
      setToast({ visible: true, message: 'Subject name cannot be empty.', type: 'error' });
      return;
    }

    try {
      setSubmittingEdit(true);
      const res = await apiClient.put(`/subjects/${editingSubject._id}`, {
        name: editName.trim(),
      });

      if (res.data?.status === 'success') {
        setToast({ visible: true, message: 'Subject renamed successfully!', type: 'success' });
        setIsEditModalOpen(false);
        setEditingSubject(null);
        setEditName('');
        fetchSubjects();
      }
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to update subject.',
        type: 'error',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openDeleteModal = (subject) => {
    setSubjectToDelete(subject);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingSubject) return;
    setDeleteModalOpen(false);
    setSubjectToDelete(null);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete || deletingSubject) return;
    try {
      setDeletingSubject(true);
      await apiClient.delete(`/subjects/${subjectToDelete._id}`);
      setToast({ visible: true, message: 'Subject deleted successfully', type: 'success' });
      setSubjects((prev) => prev.filter((s) => s._id !== subjectToDelete._id));
      setDeleteModalOpen(false);
      setSubjectToDelete(null);
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to delete subject.',
        type: 'error',
      });
    } finally {
      setDeletingSubject(false);
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

     
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Subject"
        >
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Subject Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Database Management Systems"
                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all mt-4"
            >
              Create Subject
            </button>
          </form>
        </Modal>

      
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSubject(null);
          }}
          title="Edit Subject"
        >
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Subject Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Subject Name"
                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingSubject(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEdit}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {submittingEdit ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Manage Subjects</h1>
              <p className="text-slate-400 text-sm">Configure subjects and course catalogs</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Subject
            </button>
          </div>

          {loading ? (
            <LoadingState message="Loading subjects..." />
          ) : subjects.length === 0 ? (
            <div className="bg-obsidian-900 border border-white/10 p-12 rounded-2xl text-center text-slate-400">
              No subjects created yet. Click "Add Subject" to create one.
            </div>
          ) : (
            <div className="bg-obsidian-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-obsidian-950 text-xs font-semibold uppercase text-slate-400 border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4">Subject Name</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {subjects.map((sub) => (
                      <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                          <span>{sub.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {sub.resourcesCount || 0} {sub.resourcesCount === 1 ? 'Resource' : 'Resources'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(sub)}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(sub)}
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

        
        <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white tracking-tight">Delete Subject?</h3>
              <p className="text-sm text-slate-300">
                Are you sure you want to delete <span className="font-semibold text-white">"{subjectToDelete?.name}"</span>?
              </p>
              <p className="text-xs text-rose-400/90 font-medium">This action cannot be undone.</p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingSubject}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubject}
                disabled={deletingSubject}
                className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-sm font-bold transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingSubject ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  'Delete Subject'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
