'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../../../components/layout/AdminSidebar';
import Toast from '../../../../../components/ui/Toast';
import LoadingState from '../../../../../components/ui/LoadingState';
import { OFFICIAL_RESOURCE_TYPES } from '../../../../../components/ui/ResourceTypeBadge';
import apiClient from '../../../../../lib/api-client';
import { useAuth } from '../../../../../context/AuthContext';

export default function EditResourcePage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { admin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PDF',
    subjectId: '',
    status: 'Published',
    externalUrl: '',
    embedVideoUrl: '',
    passwordProtected: false,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [wasOriginallyProtected, setWasOriginallyProtected] = useState(false);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [subRes, resRes] = await Promise.all([
          apiClient.get('/subjects'),
          apiClient.get(`/resources/${id}`),
        ]);

        if (subRes.data?.data?.subjects) {
          setSubjects(subRes.data.data.subjects);
        }

        if (resRes.data?.data?.resource) {
          const r = resRes.data.data.resource;
          const isProt = Boolean(r.passwordProtected);
          setWasOriginallyProtected(isProt);
          setFormData({
            title: r.title || '',
            description: r.description || '',
            type: r.type || 'PDF',
            subjectId: r.subject?._id || r.subject || '',
            status: r.status || 'Published',
            externalUrl: r.externalUrl || '',
            embedVideoUrl: r.embedVideoUrl || r.externalUrl || '',
            passwordProtected: isProt,
            password: '',
          });
          setExistingFileUrl(r.fileUrl || '');
        }
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load resource data.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    if (admin) fetchData();
  }, [admin, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId) {
      setToast({ visible: true, message: 'Title and Subject are required.', type: 'error' });
      return;
    }

    if (formData.passwordProtected && !wasOriginallyProtected && (!formData.password || formData.password.trim().length < 6)) {
      setToast({
        visible: true,
        message: 'A password of at least 6 characters is required when enabling protection.',
        type: 'error',
      });
      return;
    }

    if (formData.passwordProtected && formData.password && formData.password.trim().length < 6) {
      setToast({
        visible: true,
        message: 'Resource password must be at least 6 characters.',
        type: 'error',
      });
      return;
    }

    const isFileBased = formData.type === 'PDF' || formData.type === 'PYQ';
    if (isFileBased && !file && !existingFileUrl) {
      setToast({ visible: true, message: `Please attach a file for ${formData.type} resource.`, type: 'error' });
      return;
    }

    if (!isFileBased && !formData.externalUrl) {
      setToast({ visible: true, message: `Please enter a valid URL for ${formData.type} resource.`, type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('type', formData.type);
      data.append('subjectId', formData.subjectId);
      data.append('status', formData.status);
      data.append('passwordProtected', formData.passwordProtected);
      if (formData.passwordProtected && formData.password) {
        data.append('password', formData.password.trim());
      }
      if (formData.externalUrl) data.append('externalUrl', formData.externalUrl);
      if (formData.embedVideoUrl) data.append('embedVideoUrl', formData.embedVideoUrl);
      if (file) data.append('file', file);

      const res = await apiClient.put(`/resources/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        setToast({ visible: true, message: 'Resource updated successfully!', type: 'success' });
        setTimeout(() => router.push('/admin/resources'), 600);
      }
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to update resource.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <Link href="/admin/login" className="px-5 py-2.5 bg-sky-500 text-obsidian-950 font-bold rounded-xl">
          Admin Login Required
        </Link>
      </div>
    );
  }

  const isFileBased = formData.type === 'PDF' || formData.type === 'PYQ';

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

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/admin/resources" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Resources
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Edit Resource</h1>
          </div>

          {loading ? (
            <LoadingState message="Fetching resource details..." />
          ) : (
            <form onSubmit={handleSubmit} className="bg-obsidian-900 border border-white/[0.06] rounded-2xl p-4 sm:p-8 shadow-2xl space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Resource Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Official Resource Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    {OFFICIAL_RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Subject
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.code ? `${sub.name} (${sub.code})` : sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                ></textarea>
              </div>


              <div className="bg-obsidian-950/60 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="passwordProtected"
                    checked={formData.passwordProtected}
                    onChange={(e) => setFormData({ ...formData, passwordProtected: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-obsidian-900 text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="passwordProtected" className="text-sm font-semibold text-white cursor-pointer select-none flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-sky-400">lock</span>
                    Protect this resource with password
                  </label>
                </div>

                {formData.passwordProtected && (
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {wasOriginallyProtected ? 'Change Password (Optional)' : 'Resource Password *'}
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={
                          wasOriginallyProtected
                            ? 'Leave blank to keep existing password'
                            : 'Enter password (minimum 6 characters)'
                        }
                        className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>


              {isFileBased && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Attach File ({formData.type})
                  </label>
                  {existingFileUrl && !file && (
                    <div className="mb-2.5 text-xs text-sky-400 font-mono bg-sky-500/10 border border-sky-500/20 px-3.5 py-2 rounded-xl flex items-center justify-between">
                      <span className="truncate">Current file: {existingFileUrl.split('/').pop()}</span>
                      <span className="text-[11px] text-slate-400 ml-2 shrink-0">(Select new file to replace)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20"
                  />
                </div>
              )}

              {formData.type === 'Video' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value, embedVideoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo/video URL"
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              )}

              {formData.type === 'Google Drive' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Google Drive URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              )}

              {formData.type === 'Useful Link' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Resource URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    placeholder="https://example.com/..."
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                {submitting ? 'Updating Resource...' : 'Update Resource'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
