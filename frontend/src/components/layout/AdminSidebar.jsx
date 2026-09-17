'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logoutUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/admin/login');
  };

  const isActive = (path) => pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path));

  return (
    <aside className="w-64 bg-obsidian-950 border-r border-white/[0.06] min-h-screen p-6 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            NA
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight leading-none text-base">
              NotesofAni
            </h2>
            <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/admin/dashboard')
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Dashboard
          </Link>

          <Link
            href="/admin/resources"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/admin/resources')
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            Manage Resources
          </Link>

          <Link
            href="/admin/subjects"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/admin/subjects')
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            Manage Subjects
          </Link>

          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/admin/users')
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            Manage Users
          </Link>

          <Link
            href="/admin/contact-messages"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/admin/contact-messages')
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            Contact Messages
          </Link>
        </nav>
      </div>

      {/* Admin Profile & Logout */}
      <div className="pt-6 border-t border-white/[0.06]">
        {admin && (
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-white truncate">{admin.name}</p>
            <p className="text-xs text-slate-400 truncate">{admin.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
