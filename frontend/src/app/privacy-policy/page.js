'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface font-body-md text-body-md text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-16 bg-background">
        <div className="max-w-5xl mx-auto px-gutter py-space-xl">
          <div className="flex flex-col w-full">
            <div className="relative max-w-3xl mx-auto w-full px-space-md sm:px-gutter py-space-xl">
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

             
              <div className="flex flex-col items-start gap-space-sm mb-space-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary font-label-tag text-label-tag">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  LEGAL &amp; PRIVACY
                </div>
                <h1 className="font-display-hero text-headline-lg-mobile sm:text-headline-lg font-bold text-on-surface tracking-tight mt-1">
                  Privacy Policy
                </h1>
                <p className="mt-space-md font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  NotesofAni is a focused study-resource library where students and independent learners discover, save, view, and download educational resources—including handwritten notes, curated lecture PDFs, previous year question papers, video walkthroughs, and reference drives. We respect your intellectual autonomy, preserve your digital quiet, and remain committed to transparent, minimal data practices.
                </p>
              </div>

             
              <div className="flex flex-col divide-y divide-outline-variant/20">
                <section className="py-space-lg flex flex-col gap-space-sm" id="section-1">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary">01.</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Information We Collect</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    NotesofAni collects only the basic information necessary to operate the study resource library. This may include:
                  </p>
                  <ul className="flex flex-col gap-space-xs mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
                      <span><strong className="text-on-surface font-medium">Google Account details:</strong> Basic profile information provided when you optionally sign in using Google.</span>
                    </li>
                    <li className="flex items-start gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
                      <span><strong className="text-on-surface font-medium">Saved items &amp; history:</strong> Saved favorites and records of items requested for download to provide library functionality.</span>
                    </li>
                    <li className="flex items-start gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
                      <span><strong className="text-on-surface font-medium">Contact inquiries:</strong> Information submitted voluntarily through our Contact form when you reach out to us.</span>
                    </li>
                  </ul>
                </section>

                <section className="py-space-lg flex flex-col gap-space-sm" id="section-2">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary">02.</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Google Account Information</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    NotesofAni allows users to sign in using Google. When you sign in, basic account information such as your name, email address, and profile image may be provided by Google to establish and display your account.
                  </p>
                </section>

                <section className="py-space-lg flex flex-col gap-space-sm" id="section-3">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary">03.</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">How We Use Information</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Information collected is used to operate and support the platform, including:
                  </p>
                  <ul className="flex flex-col gap-space-xs mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-space-sm">
                      <span className="font-label-code text-outline text-[12px] mt-0.5">•</span>
                      <span>Maintaining your signed-in session and preferences across visits.</span>
                    </li>
                    <li className="flex items-start gap-space-sm">
                      <span className="font-label-code text-outline text-[12px] mt-0.5">•</span>
                      <span>Preserving your bookmarked study resources and download history.</span>
                    </li>
                    <li className="flex items-start gap-space-sm">
                      <span className="font-label-code text-outline text-[12px] mt-0.5">•</span>
                      <span>Responding to questions, feedback, or resource reports sent through the contact form.</span>
                    </li>
                  </ul>
                </section>

                <section className="py-space-lg flex flex-col gap-space-sm" id="section-4">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary">04.</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Cookies / HTTP-Only Storage</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Cookies or secure HTTP-only cookies are used when necessary for authentication, remembering user preferences, or supporting basic website functionality. We do not use third-party tracking cookies or ad networks.
                  </p>
                </section>

                <section className="py-space-lg flex flex-col gap-space-sm" id="section-5">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary">05.</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Data Security</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    We implement reasonable security measures designed to protect user information and prevent unauthorized access or alteration.
                  </p>
                </section>

                <section className="py-space-lg flex flex-col gap-space-sm" id="section-6">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary">06.</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Contact Us</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    For privacy-related questions or concerns, please contact us through the NotesofAni Contact page.
                  </p>
                  <div className="mt-space-sm bg-surface-container p-space-lg rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-outline-variant/30">
                    <div className="flex flex-col gap-1">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Need assistance?</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Submit your inquiry directly through our contact desk.</span>
                    </div>
                    <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-body-sm text-body-sm font-semibold px-space-lg py-2.5 rounded-lg hover:bg-primary-fixed transition-colors">
                      <span>Contact Page</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

