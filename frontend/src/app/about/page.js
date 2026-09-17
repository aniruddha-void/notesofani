'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface font-body-md text-body-md text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-16 bg-background">
        <div className="max-w-5xl mx-auto px-gutter py-space-xl">
          <div className="flex flex-col w-full">
            {/* Hero Section */}
            <section className="relative w-full py-space-xl flex flex-col items-start overflow-hidden">
              <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
              <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-tag text-label-tag uppercase tracking-widest mb-space-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                About NotesofAni
              </div>
              <h1 className="font-display-hero text-display-hero text-on-surface max-w-2xl tracking-tight leading-none mb-space-lg">
                Everything you need,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-surface-tint to-secondary">in one place.</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                NotesofAni is a simple digital resource library for discovering, saving, and downloading useful notes, PDFs, and study resources.
              </p>
              <div className="w-full h-px bg-outline-variant/30 mt-space-xl"></div>
            </section>

            {/* Core Mission Section */}
            <section className="w-full py-space-lg">
              <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-xl transition-all duration-300 hover:bg-surface-container">
                <div className="absolute top-0 right-0 p-space-lg opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-8xl text-primary">auto_stories</span>
                </div>
                <div className="max-w-2xl">
                  <span className="font-label-code text-label-code text-primary uppercase tracking-wider mb-space-xs block">Core Mission</span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-md tracking-tight">
                    What is NotesofAni?
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                    NotesofAni brings useful study notes, PDFs and resources together in one simple place, making them easier to discover, access and download.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="w-full py-space-xl">
              <div className="flex items-baseline justify-between mb-space-lg">
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">How it works</h2>
                <span className="font-label-tag text-label-tag text-outline tracking-wider">3 STEPS</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                <div className="group relative rounded-xl bg-surface-container-low p-space-lg transition-all duration-300 hover:bg-surface-container hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-space-lg">
                    <span className="font-label-code text-label-code font-bold px-2 py-1 rounded bg-surface-container-highest text-primary">01</span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[24px]">search</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">Find</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Search for the resource you need.</p>
                  <div className="mt-space-lg h-0.5 w-full bg-outline-variant/20 group-hover:bg-primary/40 transition-colors"></div>
                </div>

                <div className="group relative rounded-xl bg-surface-container-low p-space-lg transition-all duration-300 hover:bg-surface-container hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-space-lg">
                    <span className="font-label-code text-label-code font-bold px-2 py-1 rounded bg-surface-container-highest text-tertiary">02</span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors text-[24px]">bookmark_add</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">Save</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Add useful resources to your Favorites.</p>
                  <div className="mt-space-lg h-0.5 w-full bg-outline-variant/20 group-hover:bg-tertiary/40 transition-colors"></div>
                </div>

                <div className="group relative rounded-xl bg-surface-container-low p-space-lg transition-all duration-300 hover:bg-surface-container hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-space-lg">
                    <span className="font-label-code text-label-code font-bold px-2 py-1 rounded bg-surface-container-highest text-primary">03</span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[24px]">download</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">Download</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">Download resources to keep them available on your device.</p>
                  <div className="mt-space-lg h-0.5 w-full bg-outline-variant/20 group-hover:bg-primary/40 transition-colors"></div>
                </div>
              </div>
            </section>

            {/* Creator Section */}
            <section className="w-full py-space-xl">
              <div className="rounded-xl bg-surface-container-low p-space-lg md:p-space-xl transition-all duration-300 hover:bg-surface-container">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-space-lg">
                  <div className="relative shrink-0">
                    <div className="w-36 h-36 md:w-44 md:h-44 rounded-xl overflow-hidden bg-surface-container-highest shadow-xl">
                      <Image
                        src="/images/creator.png"
                        alt="Aniruddha Bhandare"
                        width={176}
                        height={176}
                        className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-center sm:text-left pt-space-xs">
                    <span className="font-label-code text-label-code text-outline uppercase tracking-wider mb-space-xs">Creator &amp; Maintainer</span>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-sm tracking-tight">
                      Created by Aniruddha Bhandare
                    </h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
                      I created NotesofAni to make useful study resources easier to find, access, and keep in one place.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="w-full py-space-xl">
              <div className="relative py-space-xl text-center flex flex-col items-center justify-center">
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-space-xs">Ready to explore?</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">Browse our collection of study notes, PDFs, and useful resources.</p>
                <Link href="/resources" className="inline-flex items-center gap-space-sm bg-primary text-on-primary font-headline-sm text-headline-sm px-6 py-3 rounded-lg shadow-md hover:bg-primary-fixed hover:text-on-primary-fixed transition-all duration-200">
                  <span>Explore Resources</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

