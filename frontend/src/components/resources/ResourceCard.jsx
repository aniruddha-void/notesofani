'use client';

import React from 'react';
import Link from 'next/link';
import ResourceTypeBadge from '../ui/ResourceTypeBadge';

export default function ResourceCard({ resource, isFavorited = false, onToggleFavorite, onDownload }) {
  if (!resource) return null;

  const subjectName = resource.subject?.name || resource.subjectName || 'General';
  const subjectCode = resource.subject?.code || resource.subjectCode || '';

  return (
    <div className="group relative bg-obsidian-800/60 backdrop-blur-xl border border-white/[0.06] hover:border-sky-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        
        <div className="flex items-center justify-between gap-3 mb-4">
          <ResourceTypeBadge type={resource.type} />
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite(resource._id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isFavorited
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-white/[0.06]'
                }`}
                title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isFavorited ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            )}
          </div>
        </div>

        
        <Link href={`/resources/${resource._id}`} className="block group-hover:text-sky-400 transition-colors">
          <h3 className="font-bold text-lg text-white tracking-tight line-clamp-2 mb-2">
            {resource.title}
          </h3>
        </Link>

        <p className="text-xs font-medium text-sky-400 mb-2">
          {subjectName} {subjectCode && `(${subjectCode})`}
        </p>
        <p className="text-sm text-slate-400 line-clamp-2 mb-6">
          {resource.description || 'No detailed description provided.'}
        </p>
      </div>

     
      <div className="pt-4 border-t border-white/[0.04] flex items-center justify-end text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {resource.type === 'PDF' && (
            <Link
              href={`/resources/${resource._id}/view`}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              View
            </Link>
          )}
          <Link
            href={`/resources/${resource._id}`}
            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium transition-colors flex items-center gap-1"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
