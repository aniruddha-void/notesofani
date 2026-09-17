'use client';

import React from 'react';

export default function ErrorState({ title = 'Something went wrong', message = 'Failed to load content. Please try again.', retry }) {
  return (
    <div className="w-full py-16 px-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4">
        <span className="material-symbols-outlined text-[24px]">error_outline</span>
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-slate-400 text-sm max-w-md mb-6">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
