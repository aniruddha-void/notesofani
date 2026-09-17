'use client';

import React from 'react';

const PUBLIC_RESOURCE_FILTER_TYPES = [
  'PDF',
  'Video',
  'PYQ',
  'Google Drive',
  'Useful Link',
];

const FILTER_PILLS = ['All', ...PUBLIC_RESOURCE_FILTER_TYPES];

export default function ResourceFilter({
  subjects = [],
  selectedSubject,
  onSelectSubject,
  selectedType,
  onSelectType,
  searchTerm,
  onSearchChange,
}) {
  return (
    <div className="w-full bg-obsidian-800/40 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 mb-8 space-y-5">
      {/* Search Bar */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search resources by title, topic, or keyword..."
          className="w-full bg-obsidian-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* LMS Subject Explorer Bar (Pill selector for Subjects) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Select Subject:
          </span>
          {selectedSubject && (
            <button
              onClick={() => onSelectSubject('')}
              type="button"
              className="text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              Show All Subjects
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectSubject('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border shrink-0 ${
              !selectedSubject
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border-white/10'
            }`}
          >
            All Subjects
          </button>

          {subjects.map((sub) => {
            const isSelected = selectedSubject === sub._id;
            return (
              <button
                key={sub._id}
                type="button"
                onClick={() => onSelectSubject(sub._id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10'
                    : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border-white/10'
                }`}
              >
                <span>{sub.name}</span>
                {sub.resourcesCount > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${isSelected ? 'bg-sky-500/30 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {sub.resourcesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Pills for Resource Type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-white/[0.04]">
        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider mr-2 shrink-0">
          Resource Type:
        </span>
        {FILTER_PILLS.map((type) => {
          const isSelected = type === 'All' ? !selectedType : selectedType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(type === 'All' ? '' : type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border shrink-0 ${
                isSelected
                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-white/5 hover:border-white/15'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Dropdown Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.04]">
        {/* Subject Filter Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Subject Dropdown
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name} {sub.resourcesCount !== undefined ? `(${sub.resourcesCount} resources)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Filter Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Resource Type Dropdown
          </label>
          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value)}
            className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50"
          >
            <option value="">All Types</option>
            {PUBLIC_RESOURCE_FILTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
