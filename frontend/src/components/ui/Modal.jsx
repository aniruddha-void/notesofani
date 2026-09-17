'use client';

import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-obsidian-900 border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {title && (
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
            <h3 id="modal-title" className="text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}

        
        <div>{children}</div>
      </div>
    </div>
  );
}
