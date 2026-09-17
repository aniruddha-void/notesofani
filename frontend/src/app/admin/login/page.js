'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdminUser, admin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (admin) {
    if (typeof window !== 'undefined') {
      router.push('/admin/dashboard');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide your administrator credentials.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginAdminUser({ email, password });
      if (res && res.status === 'success') {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary">
    
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 w-full px-gutter-lg flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-space-sm">
            <Image
              src="/images/logo.png"
              alt="NotesofAni"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight ml-space-xs">NotesofAni</span>
            <span className="font-label-tag text-label-tag px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary tracking-wide ml-space-xs">
              Admin Portal
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-body-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to NotesofAni
          </Link>
        </div>
      </header>

      
      <main className="w-full pt-16 flex-1 flex flex-col items-center justify-center px-gutter">
        <div className="flex flex-col w-full items-center justify-center py-space-xl px-gutter relative overflow-hidden">
          <div className="w-full max-w-[440px] relative z-10">

           
            {errorMsg && (
              <div className="mb-space-md bg-error-container/40 border-0 rounded-xl p-space-sm pl-space-md flex items-center justify-between text-on-error-container shadow-md backdrop-blur-md transition-all duration-300">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-error">error</span>
                  <span className="font-body-sm text-body-sm text-error font-medium">{errorMsg}</span>
                </div>
                <button
                  className="p-1 text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                  onClick={() => setErrorMsg('')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

           
            <div className="bg-surface-container rounded-xl border border-outline-variant/30 shadow-lg p-space-lg sm:p-space-xl flex flex-col relative overflow-hidden">
            
              <div className="flex flex-col items-center text-center">
                <div className="relative group mb-space-md">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-lowest flex items-center justify-center p-2.5 shadow-md">
                    <Image
                      src="/images/logo.png"
                      alt="NotesofAni Emblem"
                      width={44}
                      height={44}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-tag text-label-tag tracking-wider uppercase mb-space-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Admin Portal
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Welcome back, Admin.
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Sign in to manage NotesofAni resources.
                </p>
              </div>

             
              <form className="mt-space-lg flex flex-col gap-space-md" onSubmit={handleSubmit}>
             
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-code text-label-code text-on-surface-variant font-medium flex items-center justify-between" htmlFor="adminEmail">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-on-surface-variant/70 pointer-events-none">
                      mail
                    </span>
                    <input
                      className="w-full h-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md pl-10 pr-3.5 rounded-lg outline-none transition-all placeholder:text-on-surface-variant/40 focus:bg-surface-container-high focus:shadow-[0_0_0_2px_#3198dc]"
                      id="adminEmail"
                      name="email"
                      placeholder="Enter your admin email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

               
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-code text-label-code text-on-surface-variant font-medium" htmlFor="adminPassword">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-on-surface-variant/70 pointer-events-none">
                      lock
                    </span>
                    <input
                      className="w-full h-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md pl-10 pr-11 rounded-lg outline-none transition-all placeholder:text-on-surface-variant/40 focus:bg-surface-container-high focus:shadow-[0_0_0_2px_#3198dc]"
                      id="adminPassword"
                      name="password"
                      placeholder="Enter your password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3.5 text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

              
                <button
                  className="w-full h-11 mt-space-xs rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-all duration-200 active:scale-[0.99] shadow-md shadow-primary-container/20 group disabled:opacity-50"
                  id="submitButton"
                  type="submit"
                  disabled={loading}
                >
                  <span className="tracking-wide">{loading ? 'Signing In...' : 'Sign In'}</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

     
      <footer className="w-full bg-surface-container-lowest py-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="w-full max-w-7xl mx-auto px-gutter-lg flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <Image
              src="/images/logo.png"
              alt="NotesofAni"
              width={24}
              height={24}
              className="h-6 w-auto object-contain opacity-80"
            />
            <span className="font-body-sm text-body-sm text-on-surface-variant">Notes. Resources. Everything in one place.</span>
          </div>
          <div className="font-label-code text-label-code text-on-surface-variant">
            © {currentYear} NotesofAni. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}


