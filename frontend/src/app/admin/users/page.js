'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import LoadingState from '../../../components/ui/LoadingState';
import EmptyState from '../../../components/ui/EmptyState';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import UserAvatar from '../../../components/ui/UserAvatar';

export default function AdminUsersPage() {
  const { admin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = useCallback(async (searchQuery = '') => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await apiClient.get('/admin/users', { params });
      if (res.data?.data) {
        setUsers(res.data.data.users || []);
        setPagination(res.data.data.pagination || { total: 0, page: 1, pages: 1 });
      }
    } catch (err) {
      console.error('[AdminUsers] Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      const timer = setTimeout(() => {
        fetchUsers(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [admin, searchTerm, fetchUsers]);

  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setDetailsLoading(true);
    setUserDetails(null);

    try {
      const res = await apiClient.get(`/admin/users/${user._id}`);
      if (res.data?.data) {
        setUserDetails(res.data.data);
      }
    } catch (err) {
      console.error('[AdminUsers] Error fetching user details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

 
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
    <div className="min-h-screen bg-obsidian-950 flex flex-col md:flex-row text-slate-200">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
      
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Manage Users</h1>
              <p className="text-slate-400 text-sm mt-1">
                View registered NotesofAni students and their account activity
              </p>
            </div>

            
            <div className="self-start md:self-auto px-4 py-2 bg-obsidian-900 border border-white/10 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400 text-[20px]">group</span>
              <span className="text-xs text-slate-400 font-medium">Total Registered:</span>
              <span className="text-sm font-bold text-white">{pagination.total}</span>
            </div>
          </div>

     
          <div className="mb-8">
            <div className="relative max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-obsidian-900 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
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
            <LoadingState message="Loading user directory..." />
          ) : users.length === 0 ? (
            searchTerm.trim() ? (
              <EmptyState
                icon="person_search"
                title="No users found."
                description={`No registered accounts matched "${searchTerm}".`}
              />
            ) : (
              <EmptyState
                icon="group"
                title="No registered users yet."
                description="Google authenticated users will appear here once they log in."
              />
            )
          ) : (
            <div className="bg-obsidian-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-obsidian-950/80 text-xs font-semibold text-slate-400 uppercase border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Provider</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {users.map((u) => {
                      const avatarSrc = u.profileImage || u.avatarUrl;
                      const joinedDate = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A';

                      return (
                        <tr
                          key={u._id}
                          onClick={() => handleOpenDetails(u)}
                          className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <UserAvatar
                              src={avatarSrc}
                              name={u.name}
                              className="w-9 h-9 text-xs"
                            />
                            <span className="font-semibold text-white truncate max-w-[200px]">{u.name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono text-xs">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              Google
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{joinedDate}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetails(u);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition-all border border-sky-500/20"
                            >
                              View Details
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

    
      {isModalOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            className="bg-obsidian-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[22px]">account_circle</span>
                Student Account Details
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

           
            <div className="flex items-center gap-4 p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] mb-6">
              <UserAvatar
                src={selectedUser.profileImage || selectedUser.avatarUrl}
                name={selectedUser.name}
                className="w-14 h-14 text-base"
              />
              <div className="overflow-hidden">
                <h4 className="font-bold text-white text-base truncate">{selectedUser.name}</h4>
                <p className="text-xs text-slate-400 font-mono truncate mb-1">{selectedUser.email}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-medium">Google Auth</span>
                  <span>•</span>
                  <span>
                    Joined{' '}
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

        
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Account Activity Summary
              </h4>

              {detailsLoading ? (
                <div className="py-8">
                  <LoadingState message="Fetching student activity metrics..." />
                </div>
              ) : userDetails?.activity ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] text-center">
                    <span className="material-symbols-outlined text-sky-400 text-[22px] mb-1">visibility</span>
                    <span className="block text-2xl font-bold text-white">{userDetails.activity.viewed}</span>
                    <span className="text-[11px] text-slate-400">Viewed</span>
                  </div>

                  <div className="p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] text-center">
                    <span className="material-symbols-outlined text-emerald-400 text-[22px] mb-1">download</span>
                    <span className="block text-2xl font-bold text-white">{userDetails.activity.downloads}</span>
                    <span className="text-[11px] text-slate-400">Downloads</span>
                  </div>

                  <div className="p-4 rounded-xl bg-obsidian-950 border border-white/[0.04] text-center">
                    <span className="material-symbols-outlined text-rose-400 text-[22px] mb-1">favorite</span>
                    <span className="block text-2xl font-bold text-white">{userDetails.activity.favorites}</span>
                    <span className="text-[11px] text-slate-400">Favorites</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Unable to load activity data.</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">lock</span>
                Read-only student metrics
              </span>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
