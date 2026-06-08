// src/app/error.tsx — Global error boundary
'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/shared/Logo';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0A0A0F] px-4 text-center">
      <Logo />
      <div>
        <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-400">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-[#FFD700] px-6 py-2.5 font-bold text-black hover:bg-[#C9A227] transition-all"
      >
        Try again
      </button>
    </div>
  );
}
