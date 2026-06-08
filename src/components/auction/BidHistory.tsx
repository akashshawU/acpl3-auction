// src/components/auction/BidHistory.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import type { BidWithRelations } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  bids: BidWithRelations[];
  maxHeight?: string;
}

export function BidHistory({ bids, maxHeight = 'max-h-48' }: Props) {
  if (bids.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-gray-500">
        No bids yet — be the first!
      </div>
    );
  }

  return (
    <div className={cn('overflow-y-auto space-y-1.5', maxHeight)}>
      {bids.map((bid, i) => (
        <div
          key={bid.id}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all',
            i === 0
              ? 'border border-[#FFD700]/30 bg-[#FFD70011] animate-[fadeIn_0.3s_ease-out]'
              : 'border border-[#2A2A3A] bg-[#1A1A24]'
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: bid.team.color ?? '#6B7280' }}
            />
            <span className="font-medium">{bid.team.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-[#FFD700]">{bid.amount} pts</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
