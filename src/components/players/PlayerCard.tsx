// src/components/players/PlayerCard.tsx
import Image from 'next/image';
import type { Player } from '@/types';
import { roleLabel, roleColor, statusColor } from '@/lib/utils';
import { PlayerRatingBadge } from './PlayerRatingBadge';
import { cn } from '@/lib/utils';

interface Props {
  player: Player;
  showStatus?: boolean;
  compact?: boolean;
}

export function PlayerCard({ player, showStatus = false, compact = false }: Props) {
  const roleClr = roleColor(player.primaryRole);

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#111118] p-2">
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-[#1A1A24]">
          {player.photoUrl ? (
            <Image src={player.photoUrl} alt={player.fullName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold" style={{ color: roleClr }}>
              {player.fullName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{player.fullName}</p>
          <p className="text-xs" style={{ color: roleClr }}>{roleLabel(player.primaryRole)}</p>
        </div>
        {player.soldPrice && (
          <span className="ml-auto text-xs font-bold text-[#FFD700]">{player.soldPrice}pt</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4 transition-all hover:border-[#3A3A4A]">
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1A1A24]">
          {player.photoUrl ? (
            <Image src={player.photoUrl} alt={player.fullName} fill className="object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-xl font-bold"
              style={{ color: roleClr }}
            >
              {player.fullName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{player.fullName}</h3>
            {player.nickname && (
              <span className="text-xs text-gray-400">"{player.nickname}"</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ color: roleClr, backgroundColor: `${roleClr}22` }}
            >
              {roleLabel(player.primaryRole)}
            </span>
            <PlayerRatingBadge score={player.acplRating} category={player.acplCategory} size="sm" />
            {showStatus && (
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', statusColor(player.status))}>
                {player.status}
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-400">
            <span><span className="text-white font-medium">{player.runs}</span> runs</span>
            <span><span className="text-white font-medium">{player.wickets}</span> wkts</span>
            <span><span className="text-white font-medium">{player.matchesPlayed}</span> matches</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Base</div>
          <div className="font-bold text-[#FFD700]">{player.basePrice}pt</div>
          {player.soldPrice && (
            <>
              <div className="text-xs text-gray-500 mt-1">Sold</div>
              <div className="font-bold text-green-400">{player.soldPrice}pt</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
