'use client';

import React from 'react';

export default function StatusBadge({ status }) {
  const isPublished = status === 'Published';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isPublished
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isPublished ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
      ></span>
      {status || 'Draft'}
    </span>
  );
}
