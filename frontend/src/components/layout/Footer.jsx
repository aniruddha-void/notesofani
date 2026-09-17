'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="NotesofAni Logo"
              width={24}
              height={24}
              className="h-6 w-auto object-contain opacity-80"
            />
            <span className="font-bold text-base text-on-surface">NotesofAni</span>
          </div>
          <p className="text-xs text-on-surface-variant text-center md:text-left">Notes. Resources. Everything in one place.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-3 border-t border-outline-variant/20 flex items-center justify-center text-center">
        <span className="text-xs text-on-surface-variant">
          © {currentYear} NotesofAni. All rights reserved.
        </span>
      </div>
    </footer>
  );

}

