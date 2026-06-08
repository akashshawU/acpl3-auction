// src/hooks/useBid.ts
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseBidOptions {
  sessionId: string;
  onSuccess?: () => void;
}

export function useBid({ sessionId, onSuccess }: UseBidOptions) {
  const [placing, setPlacing] = useState(false);
  const [lastBid, setLastBid] = useState<number | null>(null);

  const placeBid = useCallback(async (amount: number) => {
    setPlacing(true);
    // Optimistic update
    setLastBid(amount);

    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, amount }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Bid placed: ${amount} pts`);
        onSuccess?.();
      } else {
        setLastBid(null);
        toast.error(data.error ?? 'Failed to place bid');
      }
    } catch {
      setLastBid(null);
      toast.error('Network error — bid not placed');
    } finally {
      setPlacing(false);
    }
  }, [sessionId, onSuccess]);

  return { placeBid, placing, lastBid };
}
