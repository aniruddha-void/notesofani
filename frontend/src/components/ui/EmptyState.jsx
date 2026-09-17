'use client';

import React from 'react';

export default function EmptyState({ icon = 'folder_open', title = 'No items found', description = 'There are currently no items matching your criteria.', action }) {
  return (
    <div className="w-full py-16 px-6 bg-obsidian-800/40 border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
