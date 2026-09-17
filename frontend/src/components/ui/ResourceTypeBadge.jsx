'use client';

import React from 'react';

const OFFICIAL_RESOURCE_TYPES = [
  'PDF',
  'Video',
  'PYQ',
  'Google Drive',
  'Useful Link',
];

const badgeStyles = {
  PDF: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Video: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  PYQ: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Google Drive': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Useful Link': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const iconMap = {
  PDF: 'picture_as_pdf',
  Video: 'play_circle',
  PYQ: 'quiz',
  'Google Drive': 'add_to_drive',
  'Useful Link': 'link',
};

export default function ResourceTypeBadge({ type }) {
  if (!OFFICIAL_RESOURCE_TYPES.includes(type)) {
    return null; 
  }

  const style = badgeStyles[type] || 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  const icon = iconMap[type] || 'article';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${style}`}
    >
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {type}
    </span>
  );
}

export { OFFICIAL_RESOURCE_TYPES };
