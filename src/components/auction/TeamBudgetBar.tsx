// src/components/auction/TeamBudgetBar.tsx
import type { TeamWithPlayers } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  team: TeamWithPlayers;
  compact?: boolean;
}

export function TeamBudgetBar({ team, compact = false }: Props) {
  const pct = team.purse > 0 ? (team.remainingPurse / team.purse) * 100 : 0;
  const barColor = pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#EF4444';
  const soldCount = team.players.filter(p => p.status === 'SOLD').length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#2A2A3A]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: team.color ?? barColor }}
          />
        </div>
        <span className="text-xs font-mono text-gray-300">{team.remainingPurse}pt</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-[#2A2A3A] bg-[#111118] p-4')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color ?? '#6B7280' }} />
          <span className="font-semibold text-sm">{team.name}</span>
        </div>
        <span className="text-xs text-gray-400">{soldCount}/10 players</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A3A]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: team.color ?? barColor }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-gray-400">
        <span>{team.remainingPurse} pts left</span>
        <span>{team.purse - team.remainingPurse} spent</span>
      </div>
    </div>
  );
}
