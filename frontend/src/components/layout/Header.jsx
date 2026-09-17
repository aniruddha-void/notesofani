'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../ui/UserAvatar';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => pathname === path;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleUserAccountClick = () => {
    setIsMenuOpen(false);
    if (user) {
      router.push('/profile');
    } else {
      router.push('/login');
    }
  };

  const handleAdminPortalClick = () => {
    setIsMenuOpen(false);
    router.push('/admin/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-obsidian-900/80 backdrop-blur-xl border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto h-20 px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 group-hover:border-sky-500/40 transition-colors shadow-sm bg-obsidian-800 flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="NotesofAni Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-sky-400 transition-colors">
            NotesofAni
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[14px]">
          <Link
            href="/"
            className={
              isActive('/')
                ? 'text-white font-semibold tracking-wide'
                : 'text-slate-400 hover:text-white transition-colors'
            }
          >
            Home
          </Link>
          <Link
            href="/resources"
            className={
              isActive('/resources')
                ? 'text-white font-semibold tracking-wide'
                : 'text-slate-400 hover:text-white transition-colors'
            }
          >
            Resources
          </Link>
          <Link
            href="/about"
            className={
              isActive('/about')
                ? 'text-white font-semibold tracking-wide'
                : 'text-slate-400 hover:text-white transition-colors'
            }
          >
            About
          </Link>
          <Link
            href="/contact"
            className={
              isActive('/contact')
                ? 'text-white font-semibold tracking-wide'
                : 'text-slate-400 hover:text-white transition-colors'
            }
          >
            Contact
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/favorites"
            aria-label="Favorites"
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isActive('/favorites')
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 hover:text-rose-400 hover:bg-white/[0.04]'
            }`}
            title="Favorites"
          >
            <span className="material-symbols-outlined text-[20px]">favorite_border</span>
          </Link>

          <Link
            href="/downloads"
            aria-label="Downloads"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isActive('/downloads')
                ? 'text-sky-400 bg-sky-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Downloads"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </Link>

          {/* Profile / Account Action Container */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <Link
                href="/profile"
                className={`inline-block rounded-full transition-all ${
                  isActive('/profile')
                    ? 'ring-2 ring-sky-500'
                    : 'hover:ring-2 hover:ring-sky-500/50'
                }`}
                title={user.name}
              >
                <UserAvatar src={user.avatarUrl} name={user.name} className="w-9 h-9 text-xs" />
              </Link>
            ) : (
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Account Menu"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all overflow-hidden border ${
                  isMenuOpen || isActive('/login')
                    ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Account Menu"
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
              </button>
            )}

            {/* Dropdown Menu (Logged out state only) */}
            {!user && isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-52 bg-obsidian-900 border border-white/10 rounded-xl shadow-2xl shadow-black/80 py-1.5 z-50 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <button
                  onClick={handleUserAccountClick}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <span>User Account</span>
                </button>
                <div className="my-1 border-t border-white/[0.06]" />
                <button
                  onClick={handleAdminPortalClick}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">admin_panel_settings</span>
                  <span>Admin Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
