// src/components/shared/LoadingSpinner.tsx
'use client';

import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-16 w-16' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          sizes[size],
          'animate-spin rounded-full border-2 border-[#2A2A3A] border-t-[#FFD700]'
        )}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-400">Loading…</p>
      </div>
    </div>
  );
}
