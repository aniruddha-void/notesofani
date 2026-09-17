'use client';

import React from 'react';

export default function LoadingState({ message = 'Loading contents...' }) {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center">
      <div className="w-10 h-10 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-sm font-medium">{message}</p>
    </div>
  );
}
