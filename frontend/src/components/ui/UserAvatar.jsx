'use client';

import React, { useState, useEffect } from 'react';

/**
 * Generates uppercase initials from a user's name
 * Example: "Aniruddha Bhandare" -> "AB"
 * Example: "Aniruddha" -> "A"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const cleanName = name.trim();
  if (!cleanName) return 'U';

  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const firstInitial = words[0].charAt(0);
    const lastInitial = words[words.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  }
  return cleanName.charAt(0).toUpperCase();
}

/**
 * UserAvatar Component
 * Handles valid image URLs, missing image URLs, and broken/expired image URLs gracefully.
 * Displays Google profile picture when available and valid; automatically switches
 * to local initials fallback if the image fails to load or is missing.
 */
export default function UserAvatar({
  src,
  name,
  className = 'w-9 h-9 text-xs',
  textClassName = '',
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = getInitials(name);

  if (src && !hasError) {
    return (
      <div className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-white/10 bg-obsidian-800 ${className}`}>
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-sky-500/30 bg-sky-500/10 text-sky-400 font-bold select-none ${className}`}
      title={name || 'User Profile'}
    >
      <span className={textClassName}>{initials}</span>
    </div>
  );
}
