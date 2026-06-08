// src/app/(admin)/auction/control/page.tsx
'use client';

import { useAuction } from '@/hooks/useAuction';
import { CurrentPlayerCard } from '@/components/auction/CurrentPlayerCard';
import { BidTimer } from '@/components/auction/BidTimer';
import { BidHistory } from '@/components/auction/BidHistory';
import { AuctionControlPanel } from '@/components/admin/AuctionControlPanel';
import { TeamBudgetBar } from '@/components/auction/TeamBudgetBar';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { BidWithRelations, TeamWithPlayers } from '@/types';
import { Wifi, WifiOff } from 'lucide-react';

const SESSION_ID = 'default-session';

export default function AuctionControlPage() {
  const { state, timer, connected } = useAuction({ role: 'admin', sessionId: SESSION_ID });

  if (!state) return <LoadingSpinner size="lg" className="py-24" />;

  const { session, currentPlayer, teams } = state;
  const bids = (session?.bids ?? []) as BidWithRelations[];
  const leadingTeam = teams.find(t => t.id === session?.currentLeaderTeamId);
  const status = session?.status ?? 'SCHEDULED';
  const hasBid = !!session?.currentBid;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Auction Control</h1>
          <div className="flex items-center gap-2 mt-1">
            {connected
              ? <><Wifi className="h-3 w-3 text-green-400" /><span className="text-xs text-green-400">Live</span></>
              : <><WifiOff className="h-3 w-3 text-red-400" /><span className="text-xs text-red-400">Reconnecting…</span></>
            }
            <span className="text-xs text-gray-500">|</span>
            <span className={`text-xs font-medium ${status === 'LIVE' ? 'text-green-400' : status === 'PAUSED' ? 'text-yellow-400' : 'text-gray-400'}`}>
              {status}
            </span>
          </div>
        </div>
        <BidTimer seconds={timer} total={session?.timerSeconds ?? 30} size={80} strokeWidth={6} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: current player + bid history */}
        <div className="lg:col-span-2 space-y-4">
          {currentPlayer ? (
            <CurrentPlayerCard
              player={currentPlayer}
              currentBid={session?.currentBid}
              leadingTeam={leadingTeam?.name}
              leadingTeamColor={leadingTeam?.color}
            />
          ) : (
            <div className="rounded-2xl border border-[#2A2A3A] bg-[#111118] p-12 text-center text-gray-500">
              No player on block. Click &quot;Next Player&quot; to begin.
            </div>
          )}

          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-400">Bid History</h3>
            <BidHistory bids={bids} />
          </div>
        </div>

        {/* Right: controls + team budgets */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-400">Controls</h3>
            <AuctionControlPanel
              sessionId={SESSION_ID}
              status={status}
              hasCurrentPlayer={!!currentPlayer}
              hasBid={hasBid}
              onAction={() => {}}
            />
          </div>

          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-400">Team Budgets</h3>
            <div className="space-y-2">
              {(teams as TeamWithPlayers[]).map(t => (
                <TeamBudgetBar key={t.id} team={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
