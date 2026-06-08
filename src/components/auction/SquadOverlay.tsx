// src/components/auction/SquadOverlay.tsx
'use client';

import type { TeamWithPlayers } from '@/types';
import { PlayerCard } from '@/components/players/PlayerCard';
import { TeamBudgetBar } from './TeamBudgetBar';

interface Props {
  team: TeamWithPlayers;
}

export function SquadOverlay({ team }: Props) {
  const squadPlayers = team.players.filter(p => p.status === 'SOLD');

  return (
    <div className="space-y-3">
      <TeamBudgetBar team={team} />
      <div className="space-y-1.5">
        {squadPlayers.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-4">No players yet</p>
        ) : (
          squadPlayers.map(p => <PlayerCard key={p.id} player={p} compact />)
        )}
      </div>
    </div>
  );
}
