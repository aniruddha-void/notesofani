'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-auto">
      <div className="max-w-5xl mx-auto px-gutter py-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg">
        <div className="flex flex-col items-center md:items-start gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <Image
              src="/images/logo.png"
              alt="NotesofAni Logo"
              width={24}
              height={24}
              className="h-6 w-auto object-contain opacity-80"
            />
            <span className="font-headline-sm text-headline-sm text-on-surface">NotesofAni</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Notes. Resources. Everything in one place.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-space-md font-body-sm text-body-sm">
          <Link href="/" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Home
          </Link>
          <Link href="/resources" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Resources
          </Link>
          <Link href="/about" className="text-on-surface-variant hover:text-on-surface transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Contact
          </Link>
          <Link href="/privacy-policy" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Privacy
          </Link>
          <Link href="/terms-and-conditions" className="text-on-surface-variant hover:text-on-surface transition-colors">
            Terms
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-gutter pb-space-lg pt-space-xs border-t border-outline-variant/20 flex items-center justify-center text-center">
        <span className="font-label-caption text-label-caption text-on-surface-variant">
          © {currentYear} NotesofAni. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

