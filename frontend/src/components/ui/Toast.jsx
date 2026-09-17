'use client';

import React from 'react';

export default function Toast({ message, type = 'info', visible = false, onClose }) {
  if (!visible || !message) return null;

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'bookmark',
  };

  const colorMap = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-sky-400',
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-obsidian-800 text-slate-200 shadow-2xl rounded-xl border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
      <span className={`material-symbols-outlined text-[20px] ${colorMap[type] || 'text-sky-400'}`}>
        {iconMap[type] || 'info'}
      </span>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}
