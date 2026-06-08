// src/components/admin/AuctionControlPanel.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play, Pause, SkipForward, CheckCircle, XCircle, RotateCcw, Undo2, StopCircle
} from 'lucide-react';

interface Props {
  sessionId: string;
  status: string;
  hasCurrentPlayer: boolean;
  hasBid: boolean;
  onAction: () => void;
}

async function callApi(path: string, body: object) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function AuctionControlPanel({ sessionId, status, hasCurrentPlayer, hasBid, onAction }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: string, apiFn: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(action);
    const data = await apiFn().catch(e => ({ success: false, error: String(e) }));
    setLoading(null);
    if (data.success) { toast.success(`${action} successful`); onAction(); }
    else toast.error(data.error ?? `${action} failed`);
  }

  const btn = (label: string, icon: React.ReactNode, fn: () => void, variant: 'gold' | 'green' | 'red' | 'blue' | 'gray', disabled?: boolean) => (
    <button
      onClick={fn}
      disabled={disabled || loading === label}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-sm transition-all disabled:opacity-40',
        variant === 'gold' && 'bg-[#FFD700] text-black hover:bg-[#C9A227]',
        variant === 'green' && 'bg-green-600 text-white hover:bg-green-700',
        variant === 'red' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'blue' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'gray' && 'bg-[#1A1A24] border border-[#2A2A3A] text-white hover:bg-[#2A2A3A]',
      )}
    >
      {loading === label ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon}
      {label}
    </button>
  );

  const isLive = status === 'LIVE';
  const isPaused = status === 'PAUSED';

  return (
    <div className="space-y-3">
      {/* Primary: Next Player */}
      {btn(
        'Next Player',
        <SkipForward className="h-4 w-4" />,
        () => handle('Next Player', () => callApi('/api/auction/next', { sessionId })),
        'gold',
      )}

      {/* Pause / Resume */}
      {isLive && btn(
        'Pause',
        <Pause className="h-4 w-4" />,
        () => handle('Pause', () => fetch('/api/auction/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'PAUSE', sessionId }),
        }).then(r => r.json())),
        'blue',
      )}
      {isPaused && btn(
        'Resume',
        <Play className="h-4 w-4" />,
        () => handle('Resume', () => fetch('/api/auction/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'RESUME', sessionId }),
        }).then(r => r.json())),
        'green',
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Mark Sold */}
        {btn(
          'Mark Sold',
          <CheckCircle className="h-4 w-4" />,
          () => handle('Mark Sold', () => callApi('/api/auction/sold', { sessionId })),
          'green',
          !hasCurrentPlayer || !hasBid,
        )}

        {/* Mark Unsold */}
        {btn(
          'Mark Unsold',
          <XCircle className="h-4 w-4" />,
          () => handle('Mark Unsold', () => callApi('/api/auction/unsold', { sessionId })),
          'red',
          !hasCurrentPlayer,
        )}

        {/* Undo Last Bid */}
        {btn(
          'Undo Bid',
          <Undo2 className="h-4 w-4" />,
          () => handle('Undo Bid', () => callApi('/api/auction/undo', { sessionId })),
          'gray',
          !hasBid,
        )}

        {/* End Auction */}
        {btn(
          'End Auction',
          <StopCircle className="h-4 w-4" />,
          () => {
            if (!confirm('End the auction? This cannot be undone.')) return;
            handle('End Auction', () => fetch('/api/auction/session', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'END', sessionId }),
            }).then(r => r.json()));
          },
          'red',
        )}
      </div>
    </div>
  );
}
