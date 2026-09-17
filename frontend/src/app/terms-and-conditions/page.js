'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface font-body-md text-body-md text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-space-xl">
          <div className="flex flex-col w-full">
            <section className="max-w-3xl mx-auto w-full py-space-xl flex flex-col gap-space-lg">
              
              <div className="flex flex-col items-start gap-space-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-tag text-label-tag tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  TERMS OF SERVICE
                </div>
                <h1 className="font-display-hero text-headline-lg md:text-display-hero text-on-surface tracking-tight mt-space-xs">
                  Terms &amp; Conditions
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-2 max-w-2xl">
                  Welcome to NotesofAni. By using this website, you agree to these Terms and Conditions. NotesofAni is an educational resource-sharing platform where students can search, browse, view, and download study notes, previous year question papers, and learning resources.
                </p>
              </div>

             
              <div className="flex flex-col gap-space-xl mt-space-md">
                <article className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors duration-200">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary font-semibold">01</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Acceptance of Terms</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pl-space-md">
                    By visiting or using NotesofAni, you agree to abide by these Terms and Conditions. If you do not agree with any part of these terms, please discontinue using the website.
                  </p>
                </article>

                <article className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors duration-200">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary font-semibold">02</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Use of NotesofAni</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pl-space-md">
                    NotesofAni is intended strictly for educational and personal study purposes. You agree to use the site and its resources responsibly and in good faith.
                  </p>
                </article>

                <article className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors duration-200">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary font-semibold">03</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">User Accounts</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pl-space-md">
                    When signing in with your Google account, you agree to provide accurate information and keep your account secure. You are responsible for all activity under your signed-in account.
                  </p>
                </article>

                <article className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors duration-200">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary font-semibold">04</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Educational Resources</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pl-space-md">
                    The notes, question papers, and study materials provided on NotesofAni are for educational reference only. While we aim to keep resources accurate and helpful, they are provided on an 'as-is' basis.
                  </p>
                </article>

                <article className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors duration-200">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary font-semibold">05</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Downloads and External Links</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pl-space-md">
                    Resources and downloadable files are provided solely for personal and academic study. Redistribution, commercial resale, or re-uploading of downloaded materials is strictly prohibited.
                  </p>
                </article>

                <article className="flex flex-col gap-space-xs p-space-lg rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors duration-200">
                  <div className="flex items-baseline gap-space-sm">
                    <span className="font-label-code text-label-code text-primary font-semibold">06</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Intellectual Property</h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed pl-space-md">
                    The NotesofAni brand name, logo, site design, and code are the property of NotesofAni and its creator. Original study materials remain the property of their respective creators.
                  </p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

