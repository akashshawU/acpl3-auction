// src/components/auction/CurrentPlayerCard.tsx
'use client';

import Image from 'next/image';
import type { Player } from '@/types';
import { roleLabel, roleColor } from '@/lib/utils';
import { PlayerRatingBadge } from '@/components/players/PlayerRatingBadge';

interface Props {
  player: Player;
  currentBid?: number | null;
  leadingTeam?: string | null;
  leadingTeamColor?: string | null;
}

export function CurrentPlayerCard({ player, currentBid, leadingTeam, leadingTeamColor }: Props) {
  const roleClr = roleColor(player.primaryRole);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#2A2A3A] bg-[#111118] p-6">
      {/* Photo */}
      <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-[#1A1A24]">
        {player.photoUrl ? (
          <Image src={player.photoUrl} alt={player.fullName} fill className="object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-bold"
            style={{ color: roleClr }}
          >
            {player.fullName.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <h2 className="text-xl font-bold">{player.fullName}</h2>
        {player.nickname && <p className="text-sm text-gray-400">"{player.nickname}"</p>}
        <div className="mt-1 flex justify-center gap-2">
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{ color: roleClr, backgroundColor: `${roleClr}22` }}
          >
            {roleLabel(player.primaryRole)}
          </span>
          <PlayerRatingBadge score={player.acplRating} category={player.acplCategory} size="sm" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
        <div><div className="font-mono font-bold text-white">{player.runs}</div><div className="text-gray-500">Runs</div></div>
        <div><div className="font-mono font-bold text-white">{player.wickets}</div><div className="text-gray-500">Wkts</div></div>
        <div><div className="font-mono font-bold text-white">{player.strikeRate.toFixed(0)}</div><div className="text-gray-500">SR</div></div>
      </div>

      {/* Bid info */}
      <div className="w-full rounded-xl bg-[#1A1A24] p-3 text-center">
        <div className="text-xs text-gray-400">
          {currentBid ? 'Current Bid' : 'Base Price'}
        </div>
        <div className="font-display text-3xl font-bold text-[#FFD700]">
          {currentBid ?? player.basePrice} pts
        </div>
        {leadingTeam && (
          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: leadingTeamColor ?? '#6B7280' }} />
            <span className="text-gray-300">Leading: {leadingTeam}</span>
          </div>
        )}
      </div>
    </div>
  );
}
