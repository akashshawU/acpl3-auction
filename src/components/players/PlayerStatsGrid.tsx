// src/components/players/PlayerStatsGrid.tsx
import type { Player } from '@/types';

interface Props { player: Player; }

export function PlayerStatsGrid({ player }: Props) {
  const stats = [
    { label: 'Matches', value: player.matchesPlayed },
    { label: 'Runs', value: player.runs },
    { label: 'Highest Score', value: player.highestScore },
    { label: 'Avg', value: player.battingAverage.toFixed(1) },
    { label: 'Strike Rate', value: player.strikeRate.toFixed(1) },
    { label: 'Wickets', value: player.wickets },
    { label: 'Economy', value: player.economyRate > 0 ? player.economyRate.toFixed(2) : '—' },
    { label: 'Best Bowling', value: player.bestBowlingFigures ?? '—' },
    { label: 'Catches', value: player.catches },
    { label: 'Run Outs', value: player.runOuts },
    { label: 'MoM Awards', value: player.momAwards },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {stats.map(s => (
        <div key={s.label} className="rounded-lg border border-[#2A2A3A] bg-[#1A1A24] p-3 text-center">
          <div className="font-mono text-lg font-bold text-[#FFD700]">{s.value}</div>
          <div className="text-xs text-gray-400">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
