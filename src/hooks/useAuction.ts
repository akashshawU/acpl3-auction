'use client';
import { useEffect, useState, useCallback } from 'react';
import type { AuctionState } from '@/types';

export function useAuction({ sessionId }: { role?: string; sessionId?: string }) {
  const [state, setState] = useState<AuctionState | null>(null);
  const [timer, setTimer] = useState(0);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/auction/session?id=${sessionId ?? 'default-session'}`);
      const data = await res.json();
      if (data.success) {
        setState(data.data);
        setTimer(data.data.timerRemaining ?? 0);
      }
    } catch { /* ignore */ }
  }, [sessionId]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  return { state, timer, connected: true, emit: () => {} };
}
