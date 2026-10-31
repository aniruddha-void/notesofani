'use client';

import React from 'react';
import Link from 'next/link';
import ResourceTypeBadge from '../ui/ResourceTypeBadge';

export default function ResourceCard({ resource, isFavorited = false, onToggleFavorite, onDownload }) {
  if (!resource) return null;

  const subjectName = resource.subject?.name || resource.subjectName || 'General';
  const subjectCode = resource.subject?.code || resource.subjectCode || '';

  return (
    <div className="group relative bg-obsidian-800/60 backdrop-blur-xl border border-white/[0.06] hover:border-sky-500/30 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
      <div>
        
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ResourceTypeBadge type={resource.type} />
            {resource.isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm">
                <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                ₹{resource.price}
              </span>
            )}
            {resource.isPurchased && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                Unlocked
              </span>
            )}
            {resource.hasPendingPurchase && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
          <h3 className="font-bold text-base sm:text-lg text-white tracking-tight line-clamp-2 mb-2 break-words">
            {resource.title}
          </h3>
        </Link>

        <p className="text-xs font-medium text-sky-400 mb-2 truncate">
          {subjectName} {subjectCode && `(${subjectCode})`}
        </p>
        <p className="text-sm text-slate-400 line-clamp-2 mb-6 break-words">
          {resource.description || 'No detailed description provided.'}
        </p>
      </div>

     
      <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-400">
        <div>
          {resource.isPremium && !resource.isPurchased ? (
            <span className="text-xs font-bold text-amber-400">
              ₹{resource.price} <span className="text-[10px] font-normal text-slate-400">INR</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {resource.isPurchased ? 'Purchased' : 'Free Resource'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {resource.isPremium && !resource.isPurchased && !resource.hasPendingPurchase ? (
            <Link
              href={`/resources/${resource._id}`}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-amber-500/20"
            >
              <span className="material-symbols-outlined text-[15px]">shopping_cart</span>
              Buy Now
            </Link>
          ) : (
            <>
              {resource.type === 'PDF' && resource.isUnlocked && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
