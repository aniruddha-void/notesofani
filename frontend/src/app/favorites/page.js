'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ResourceCard from '../../components/resources/ResourceCard';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (user) {
        try {
          setLoading(true);
          const res = await apiClient.get('/user/favorites');
          if (res.data?.data?.favorites) {
            setFavorites(res.data.data.favorites);
          }
        } catch (err) {
          console.error('[FavoritesPage] Fetch error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (resourceId) => {
    try {
      await apiClient.delete(`/user/favorites/${resourceId}`);
      setFavorites((prev) => prev.filter((item) => (item.resource?._id || item.resource) !== resourceId));
    } catch (err) {
      console.error('[FavoritesPage] Remove favorite error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
          <LoadingState message="Loading your favorites..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <main className="pt-28 pb-16 px-6 max-w-md mx-auto text-center">
          <div className="bg-obsidian-800/60 border border-white/[0.06] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400 text-sm mb-6">Please sign in to view your favorited study materials.</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
            >
              Sign In with Google
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />

      <main className="w-full pt-28 pb-16 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">My Favorites</h1>
          <p className="text-slate-400 text-sm">Your bookmarked notes, papers, and study guides.</p>
        </div>

        {loading ? (
          <LoadingState message="Fetching your saved favorites..." />
        ) : favorites.length === 0 ? (
          <EmptyState
            icon="favorite_border"
            title="No Favorites Saved Yet"
            description="Bookmark resources while browsing to save them here for quick access during exam prep."
            action={
              <Link
                href="/resources"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20"
              >
                Browse Resources
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const res = fav.resource;
              if (!res) return null;
              return (
                <ResourceCard
                  key={fav._id}
                  resource={res}
                  isFavorited={true}
                  onToggleFavorite={() => handleRemoveFavorite(res._id)}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
