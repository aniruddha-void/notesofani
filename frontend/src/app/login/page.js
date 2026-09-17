'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';

export default function UserSignInPage() {
  const router = useRouter();
  const { loginGoogleUser, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);
  const gisContainerRef = useRef(null);

  const getSafeReturnTo = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const returnToParam = params.get('returnTo');
      if (returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//') && !returnToParam.includes(':\\')) {
        return returnToParam;
      }
    }
    return '/profile';
  };


  useEffect(() => {
    if (user) {
      router.push(getSafeReturnTo());
    }
  }, [user, router]);

  const handleGoogleCallback = async (response) => {
    if (!response || !response.credential) {
      setErrorMsg('Google sign-in did not return a valid credential.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginGoogleUser({ idToken: response.credential });

      if (res && res.status === 'success') {
        router.push(getSafeReturnTo());
      } else {
        setErrorMsg(res?.message || 'Google sign-in failed. Please try again.');
      }
    } catch (err) {
      console.error('[Google Sign-In Error]:', err);
      setErrorMsg(err.response?.data?.message || 'Unable to complete Google sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGIS = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (gisContainerRef.current) {
            window.google.accounts.id.renderButton(gisContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              type: 'standard',
              text: 'continue_with',
            });
          }
        } catch (err) {
          console.error('[GIS Initialization Error]:', err);
        }
      }
    };

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initGIS();
    } else if (gisLoaded) {
      initGIS();
    }
  }, [gisLoaded]);

  const handleButtonClick = () => {
    setErrorMsg('');
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const renderedBtn = gisContainerRef.current?.querySelector('iframe, div[role="button"]');
          if (renderedBtn) {
            renderedBtn.click();
          }
        }
      });
    } else {
      setErrorMsg('Google Sign-In is initializing. Please try again in a moment.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface font-body-md text-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisLoaded(true)}
      />
      <Header />

      <main className="w-full pt-16 bg-surface flex-grow flex items-center justify-center">
        <div className="flex flex-col w-full items-center justify-center py-space-xl px-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-gradient-to-tr from-secondary-container/10 via-primary-container/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute -top-32 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-2xl pointer-events-none -z-10"></div>

          <div className="w-full max-w-[440px] flex flex-col items-start mb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-body-sm text-on-surface-variant hover:text-primary transition-colors py-1 px-1 focus:outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Home
            </Link>
          </div>

          <div className="w-full max-w-[440px] bg-surface-container-low/95 backdrop-blur-xl rounded-xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] relative flex flex-col items-center text-center transition-all duration-300">
            <Image
              src="/images/logo.png"
              alt="NotesofAni"
              width={56}
              height={56}
              className="w-14 h-14 object-contain mx-auto mb-5 rounded-2xl shadow-lg"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest/60 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-tag text-label-tag text-on-surface-variant tracking-wider uppercase">Welcome to NotesofAni</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-tight mb-3">
              Your notes.<br />
              <span className="text-primary">One place.</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px] mb-8 leading-relaxed tracking-normal font-normal">
              Sign in to access your notes, PDFs and resources.
            </p>

            <div className="w-full flex flex-col gap-3 items-center" id="auth-container">
              <div className="relative w-full flex justify-center items-center">
                <button
                  aria-label="Continue with Google"
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-highest hover:bg-surface-bright active:scale-[0.99] text-on-surface font-body-md font-medium flex items-center justify-center gap-3 transition-all duration-200 shadow-sm relative overflow-hidden group cursor-pointer disabled:opacity-50"
                  type="button"
                  onClick={handleButtonClick}
                  disabled={loading}
                >
                  <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" fill="#4285F4"></path>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" fill="#34A853"></path>
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" fill="#FBBC05"></path>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" fill="#EA4335"></path>
                  </svg>
                  <span className="tracking-normal font-medium">{loading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>

                
                <div
                  ref={gisContainerRef}
                  className="absolute inset-0 overflow-hidden pointer-events-auto flex items-center justify-center cursor-pointer z-10"
                  style={{ opacity: 0.001 }}
                />
              </div>

              {errorMsg && (
                <div className="w-full flex flex-col items-center justify-center p-3 rounded-lg bg-surface-container text-center transition-all duration-300 text-error font-body-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-[18px]">error</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full mt-8 pt-6 flex flex-col items-center gap-2 border-t border-outline-variant/20">
              <p className="font-label-caption text-label-caption text-on-surface-variant/80 leading-relaxed max-w-[320px] tracking-normal">
                By continuing, you agree to the NotesofAni{' '}
                <Link className="text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-outline-variant" href="/terms-and-conditions">
                  Terms
                </Link>{' '}
                and{' '}
                <Link className="text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-outline-variant" href="/privacy-policy">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
