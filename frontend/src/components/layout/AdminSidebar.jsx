'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logoutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/admin/login');
  };

  const isActive = (path) => pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path));

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/resources', label: 'Manage Resources', icon: 'folder_open' },
    { href: '/admin/subjects', label: 'Manage Subjects', icon: 'menu_book' },
    { href: '/admin/users', label: 'Manage Users', icon: 'group' },
    { href: '/admin/contact-messages', label: 'Contact Messages', icon: 'mail' },
  ];

  return (
    <>
      <div className="md:hidden w-full bg-obsidian-950 border-b border-white/[0.06] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            NA
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight leading-none text-sm">
              NotesofAni
            </h2>
            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Toggle Admin Navigation"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {isOpen && (
        <nav className="md:hidden bg-obsidian-950 border-b border-white/[0.06] px-4 py-4 space-y-2 z-30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(link.href)
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {admin && (
            <div className="pt-3 border-t border-white/[0.06] mt-3">
              <div className="px-2 mb-3">
                <p className="text-xs font-semibold text-white truncate">{admin.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{admin.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </nav>
      )}

      <aside className="hidden md:flex w-64 bg-obsidian-950 border-r border-white/[0.06] min-h-screen p-6 flex-col justify-between shrink-0">
        <div>
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

          <nav className="space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

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
    </>
  );
}

