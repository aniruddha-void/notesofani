'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ResourceCard from '../components/resources/ResourceCard';
import LoadingState from '../components/ui/LoadingState';
import apiClient from '../lib/api-client';

const OFFICIAL_CATEGORIES = ['All', 'PDF', 'Video', 'PYQ', 'Google Drive', 'Useful Link'];

export default function HomePage() {
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const resRes = await apiClient.get('/resources?limit=6');

        if (resRes.data?.data?.resources) {
          setFeaturedResources(resRes.data.data.resources);
        }
      } catch (err) {
        console.error('[HomePage] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) {
      window.location.href = `/resources?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  const filteredResources = featuredResources.filter((res) => {
    if (selectedCategory === 'All') return true;
    return res.type === selectedCategory;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-obsidian-900 font-sans antialiased text-slate-200 selection:bg-sky-500/20 selection:text-sky-300 relative overflow-x-hidden">
      
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-sky-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 -right-48 w-[400px] h-[400px] bg-sky-900/10 blur-[120px] pointer-events-none -z-10"></div>

      <Header />

      <main className="w-full pt-20">
        
        <section className="w-full pt-20 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] text-balance">
              Notes. Resources.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-sky-200 to-sky-400">
                Everything in one place.
              </span>
            </h1>

            
            <p className="mt-5 sm:mt-7 text-sm sm:text-lg md:text-xl text-slate-400 font-light max-w-2xl text-balance leading-relaxed">
              Discover notes, PDFs and useful resources — simple, organized and always within reach.
            </p>

            
            <div className="w-full max-w-2xl mt-8 sm:mt-10 relative group px-2 sm:px-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500/30 to-blue-600/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 group-focus-within:opacity-100 group-focus-within:from-sky-500/50 group-focus-within:to-blue-500/30 transition duration-500"></div>
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center bg-obsidian-800 border border-white/10 group-hover:border-white/20 group-focus-within:border-sky-500/50 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-2xl transition-all"
              >
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-sky-400 text-[20px] sm:text-[22px] mr-2.5 sm:mr-3.5 transition-colors">
                  search
                </span>
                <input
                  className="w-full bg-transparent text-white placeholder:text-slate-500 text-xs sm:text-base font-normal focus:outline-none"
                  id="librarySearch"
                  placeholder="Search notes, PDFs, resources…"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>

            
            <div className="mt-8 sm:mt-12 flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 max-w-2xl">
              {OFFICIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-white/5 hover:border-white/15'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

       
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" id="resources">
          <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-6 mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Explore Resources</h2>
              <p className="text-sm text-slate-400 mt-1 font-light">Browse notes, PDFs, videos, PYQs, and other useful resources.</p>
            </div>
            <span className="text-xs font-mono text-slate-400 tracking-wider">
              {filteredResources.length} {filteredResources.length === 1 ? 'Resource' : 'Resources'}
            </span>
          </div>

          {loading ? (
            <LoadingState message="Loading resources..." />
          ) : filteredResources.length === 0 ? (
            <div className="bg-obsidian-800/40 border border-white/[0.06] rounded-2xl p-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">folder_open</span>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">No resources found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No resources are available in this category yet. Real resources added by admin will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="resourceGrid">
              {filteredResources.map((res) => (
                <ResourceCard key={res._id} resource={res} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

