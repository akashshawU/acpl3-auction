// src/app/(captain)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuction } from '@/hooks/useAuction';
import { useBid } from '@/hooks/useBid';
import { BidTimer } from '@/components/auction/BidTimer';
import { BidHistory } from '@/components/auction/BidHistory';
import { PlayerCard } from '@/components/players/PlayerCard';
import { PlayerRatingBadge } from '@/components/players/PlayerRatingBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { canTeamBid } from '@/lib/bid-validation';
import { roleLabel, roleColor, cn } from '@/lib/utils';
import type { BidWithRelations, TeamWithPlayers } from '@/types';
import { Wifi, WifiOff } from 'lucide-react';
import Image from 'next/image';

const SESSION_ID = 'default-session';

export default function CaptainDashboardPage() {
  const { state, timer, connected } = useAuction({ role: 'captain', sessionId: SESSION_ID });
  const [myTeamId, setMyTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(d => {
      if (d.success) {
        // Find my team via session (server-side session exposes teamId)
        fetch('/api/auth/session').then(r => r.json()).then(s => {
          setMyTeamId(s?.user?.teamId ?? null);
        });
      }
    });
  }, []);

  const { placeBid, placing, lastBid } = useBid({ sessionId: SESSION_ID });

  if (!state) return <LoadingSpinner size="lg" className="py-24" />;

  const { session, currentPlayer, teams } = state;
  const myTeam = teams.find(t => t.id === myTeamId) as TeamWithPlayers | undefined;
  const bids = (session?.bids ?? []) as BidWithRelations[];
  const leadingTeam = teams.find(t => t.id === session?.currentLeaderTeamId);
  const status = session?.status ?? 'SCHEDULED';
  const isLive = status === 'LIVE';

  const nextBidAmount = currentPlayer
    ? (session?.currentBid ?? (currentPlayer.basePrice - (session?.bidIncrement ?? 1))) + (session?.bidIncrement ?? 1)
    : 0;

  // Validate bid eligibility
  const validation = myTeam && currentPlayer
    ? canTeamBid(myTeam, currentPlayer, nextBidAmount, 0)
    : { allowed: false, reason: 'Waiting for auction…' };

  const isLeading = myTeam && session?.currentLeaderTeamId === myTeam.id;
  const canBid = isLive && !!currentPlayer && validation.allowed && !isLeading;

  const roleClr = currentPlayer ? roleColor(currentPlayer.primaryRole) : '#6B7280';

  return (
    <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 justify-end">
        {connected
          ? <><Wifi className="h-3 w-3 text-green-400" /><span className="text-xs text-green-400">Connected</span></>
          : <><WifiOff className="h-3 w-3 text-red-400" /><span className="text-xs text-red-400">Reconnecting…</span></>
        }
        <span className="text-xs text-gray-500 ml-2">
          Status: <span className={isLive ? 'text-green-400' : 'text-yellow-400'}>{status}</span>
        </span>
      </div>

      {/* My budget */}
      {myTeam && (
        <div className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">My Budget</div>
            <div className="font-display text-3xl font-bold text-[#FFD700]">{myTeam.remainingPurse}</div>
            <div className="text-xs text-gray-400">points remaining</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Squad</div>
            <div className="font-bold text-2xl">{myTeam.players.filter(p => p.status === 'SOLD').length}<span className="text-sm font-normal text-gray-400">/10</span></div>
          </div>
        </div>
      )}

      {/* Current Player */}
      {currentPlayer ? (
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#111118] overflow-hidden">
          <div className="relative h-48 bg-gradient-to-b from-[#1A1A24] to-[#111118] flex items-center justify-center">
            {currentPlayer.photoUrl ? (
              <Image src={currentPlayer.photoUrl} alt={currentPlayer.fullName} fill className="object-cover opacity-40" />
            ) : null}
            <div className="relative z-10 text-center">
              <div
                className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2 text-3xl font-bold"
                style={{ borderColor: roleClr, color: roleClr, backgroundColor: `${roleClr}22` }}
              >
                {currentPlayer.fullName.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{currentPlayer.fullName}</h2>
              {currentPlayer.nickname && <p className="text-sm text-gray-400">"{currentPlayer.nickname}"</p>}
              <div className="mt-1 flex justify-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: roleClr, backgroundColor: `${roleClr}22` }}>
                  {roleLabel(currentPlayer.primaryRole)}
                </span>
                <PlayerRatingBadge score={currentPlayer.acplRating} category={currentPlayer.acplCategory} size="sm" />
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 divide-x divide-[#2A2A3A] border-t border-[#2A2A3A] text-center">
            {[
              { label: 'Runs', value: currentPlayer.runs },
              { label: 'Wickets', value: currentPlayer.wickets },
              { label: 'SR', value: currentPlayer.strikeRate.toFixed(0) },
              { label: 'MoM', value: currentPlayer.momAwards },
            ].map(s => (
              <div key={s.label} className="py-3">
                <div className="font-mono font-bold">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bid section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">{session?.currentBid ? 'Current Bid' : 'Base Price'}</div>
                <div className={cn('font-display text-4xl font-bold text-[#FFD700]', lastBid === nextBidAmount && 'animate-[countUp_0.3s_ease-out]')}>
                  {session?.currentBid ?? currentPlayer.basePrice}
                </div>
                <div className="text-xs text-gray-400">points</div>
              </div>
              <BidTimer seconds={timer} total={session?.timerSeconds ?? 30} size={80} />
            </div>

            {leadingTeam && (
              <div className="flex items-center gap-1.5 text-sm">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: leadingTeam.color ?? '#6B7280' }} />
                <span className={leadingTeam.id === myTeamId ? 'text-green-400 font-medium' : 'text-gray-400'}>
                  {leadingTeam.id === myTeamId ? '🏆 You\'re winning!' : `${leadingTeam.name} is leading`}
                </span>
              </div>
            )}

            {/* BID NOW button */}
            <div className="group relative">
              <button
                onClick={() => placeBid(nextBidAmount)}
                disabled={!canBid || placing}
                className={cn(
                  'w-full rounded-xl py-4 text-lg font-bold transition-all',
                  canBid && !placing
                    ? 'bg-[#FFD700] text-black hover:bg-[#C9A227] active:scale-95'
                    : 'cursor-not-allowed bg-[#1A1A24] text-gray-500 border border-[#2A2A3A]'
                )}
              >
                {placing ? <LoadingSpinner size="sm" className="mx-auto" /> :
                  isLeading ? '✓ You\'re Winning' :
                  !isLive ? 'Waiting…' :
                  !canBid ? '🚫 Cannot Bid' :
                  `BID ${nextBidAmount} pts`
                }
              </button>
              {!canBid && validation.reason && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-red-400">
                  {validation.reason}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#111118] p-12 text-center text-gray-500">
          {isLive ? 'Waiting for next player…' : 'Auction has not started yet.'}
        </div>
      )}

      {/* Bid History */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-400">Bids for this player</h3>
        <BidHistory bids={bids} maxHeight="max-h-40" />
      </div>
    </div>
  );
}
