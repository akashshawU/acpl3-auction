// src/app/(captain)/squad/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { PlayerCard } from '@/components/players/PlayerCard';
import { TeamBudgetBar } from '@/components/auction/TeamBudgetBar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { TeamWithPlayers } from '@/types';

export default function CaptainSquadPage() {
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(d => {
      if (d.success) {
        // My team is determined from session teamId
        fetch('/api/auth/session').then(r => r.json()).then(s => {
          const myTeamId = s?.user?.teamId;
          const myTeam = d.data.find((t: TeamWithPlayers) => t.id === myTeamId);
          setTeam(myTeam ?? null);
          setLoading(false);
        });
      }
    });
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;
  if (!team) return <div className="p-6 text-gray-400">No team assigned</div>;

  const soldPlayers = team.players.filter(p => p.status === 'SOLD');
  const roleGroups = ['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

  return (
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold">My Squad</h1>
      <TeamBudgetBar team={team} />

      {roleGroups.map(role => {
        const rolePlayers = soldPlayers.filter(p => p.primaryRole === role);
        if (rolePlayers.length === 0) return null;
        return (
          <div key={role}>
            <h2 className="mb-2 text-sm font-semibold text-gray-400">{role.replace('_', ' ')}S</h2>
            <div className="space-y-2">
              {rolePlayers.map(p => <PlayerCard key={p.id} player={p} compact />)}
            </div>
          </div>
        );
      })}

      {soldPlayers.length === 0 && (
        <p className="text-center text-gray-500 py-8">No players in squad yet</p>
      )}
    </div>
  );
}
