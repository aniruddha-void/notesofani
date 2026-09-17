'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ResourceFilter from '../../components/resources/ResourceFilter';
import ResourceCard from '../../components/resources/ResourceCard';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ResourceTypeBadge from '../../components/ui/ResourceTypeBadge';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';

const OFFICIAL_TYPES = ['PDF', 'Video', 'PYQ', 'Google Drive', 'Useful Link'];

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Subject Inventory state (STABLE full inventory for active subject banner)
  const [subjectInventory, setSubjectInventory] = useState([]);

  // Fetch subjects with resource counts
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await apiClient.get('/subjects');
        if (res.data?.data?.subjects) {
          setSubjects(res.data.data.subjects);
        }
      } catch (err) {
        console.error('[ResourcesPage] Subjects fetch error:', err);
      }
    }
    fetchSubjects();
  }, []);

  // Fetch user favorites if logged in
  useEffect(() => {
    async function fetchUserFavorites() {
      if (user) {
        try {
          const res = await apiClient.get('/user/favorites');
          if (res.data?.data?.favorites) {
            setFavorites(res.data.data.favorites.map((f) => f.resource?._id || f.resource));
          }
        } catch (err) {
          console.error('[ResourcesPage] Favorites fetch error:', err);
        }
      }
    }
    fetchUserFavorites();
  }, [user]);

  // Fetch stable full subject inventory whenever selectedSubject changes (unfiltered by selectedType)
  useEffect(() => {
    async function fetchSubjectInventory() {
      if (!selectedSubject) {
        setSubjectInventory([]);
        return;
      }
      try {
        const res = await apiClient.get(`/resources?subject=${selectedSubject}&limit=100`);
        if (res.data?.data?.resources) {
          setSubjectInventory(res.data.data.resources);
        }
      } catch (err) {
        console.error('[ResourcesPage] Subject inventory fetch error:', err);
      }
    }
    fetchSubjectInventory();
  }, [selectedSubject]);

  // Fetch filtered display resources when filters change
  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', selectedSubject ? 50 : 12);
        if (selectedSubject) params.append('subject', selectedSubject);
        if (selectedType) params.append('type', selectedType);
        if (searchTerm) params.append('search', searchTerm);

        const res = await apiClient.get(`/resources?${params.toString()}`);
        if (res.data?.data) {
          setResources(res.data.data.resources || []);
          setTotalPages(res.data.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('[ResourcesPage] Resources fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [selectedSubject, selectedType, searchTerm, page]);

  const handleToggleFavorite = async (resourceId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const isFav = favorites.includes(resourceId);
    try {
      if (isFav) {
        await apiClient.delete(`/user/favorites/${resourceId}`);
        setFavorites((prev) => prev.filter((id) => id !== resourceId));
      } else {
        await apiClient.post(`/user/favorites/${resourceId}`);
        setFavorites((prev) => [...prev, resourceId]);
      }
    } catch (err) {
      console.error('[ResourcesPage] Favorite toggle error:', err);
    }
  };

  const activeSubjectObj = subjects.find((s) => s._id === selectedSubject);

  // Compute STABLE type counts from full subjectInventory (independent of type filter)
  const subjectTypeCounts = OFFICIAL_TYPES.reduce((acc, t) => {
    acc[t] = subjectInventory.filter((r) => r.type === t).length;
    return acc;
  }, {});

  const totalSubjectResources = subjectInventory.length || activeSubjectObj?.resourcesCount || 0;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="w-full pt-28 pb-16 px-6 sm:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            Study Material Library
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Select a subject to view all belonging PDFs, Video lectures, PYQs, Google Drive resources, and Educational links.
          </p>
        </div>

        {/* Filter Toolbar */}
        <ResourceFilter
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelectSubject={(val) => { setSelectedSubject(val); setPage(1); }}
          selectedType={selectedType}
          onSelectType={(val) => { setSelectedType(val); setPage(1); }}
          searchTerm={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
        />

        {/* Dedicated LMS Subject Header Banner when a Subject is selected */}
        {activeSubjectObj && (
          <div className="bg-obsidian-900 border border-sky-500/30 rounded-2xl p-6 mb-8 shadow-xl shadow-sky-500/5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Active Subject</span>
                <h2 className="text-2xl font-bold text-white tracking-tight">{activeSubjectObj.name}</h2>
                {activeSubjectObj.description && (
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{activeSubjectObj.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-bold">
                  {totalSubjectResources} Total Resources
                </span>
              </div>
            </div>

            {/* STABLE Type Breakdown Counters */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[11px]">Breakdown:</span>
              {OFFICIAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(selectedType === t ? '' : t)}
                  className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                    selectedType === t
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10'
                      : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/15 hover:text-white'
                  }`}
                >
                  {t}: <span className="font-bold text-white ml-1">{subjectTypeCounts[t] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resources Grid / State */}
        {loading ? (
          <LoadingState message="Fetching study resources..." />
        ) : resources.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No resources found"
            description={
              selectedSubject
                ? `No resources uploaded for ${activeSubjectObj?.name || 'this subject'} matching your criteria.`
                : "We couldn't find any resources matching your selected filters."
            }
            action={
              <button
                onClick={() => {
                  setSelectedSubject('');
                  setSelectedType('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-sm font-medium transition-colors"
              >
                Clear All Filters
              </button>
            }
          />
        ) : (
          <>
            {/* Subject View: Grouped by Type when viewing a Subject and 'All Types' selected */}
            {selectedSubject && !selectedType && !searchTerm ? (
              <div className="space-y-10 mb-12">
                {OFFICIAL_TYPES.map((type) => {
                  const typeResources = resources.filter((r) => r.type === type);
                  if (typeResources.length === 0) return null;

                  return (
                    <div key={type} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
                        <ResourceTypeBadge type={type} />
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          ({typeResources.length} {typeResources.length === 1 ? 'item' : 'items'})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {typeResources.map((res) => (
                          <ResourceCard
                            key={res._id}
                            resource={res}
                            isFavorited={favorites.includes(res._id)}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Flat Grid View when filtering by specific Type, Search, or All Subjects */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {resources.map((res) => (
                  <ResourceCard
                    key={res._id}
                    resource={res}
                    isFavorited={favorites.includes(res._id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-obsidian-800 border border-white/10 text-sm font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.04]"
                >
                  Previous
                </button>
                <span className="text-sm font-mono text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl bg-obsidian-800 border border-white/10 text-sm font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.04]"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
