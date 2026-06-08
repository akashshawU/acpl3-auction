// src/app/auction/live/page.tsx
'use client';

import { useAuction } from '@/hooks/useAuction';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { roleLabel, roleColor } from '@/lib/utils';
import { PlayerRatingBadge } from '@/components/players/PlayerRatingBadge';
import { Logo } from '@/components/shared/Logo';
import type { BidWithRelations, TeamWithPlayers } from '@/types';
import confetti from 'canvas-confetti';

const SESSION_ID = 'default-session';

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? seconds / total : 0;
  const offset = circ * (1 - pct);
  const isUrgent = seconds <= 10 && seconds > 0;
  return (
    <div className={`relative inline-flex items-center justify-center ${isUrgent ? 'animate-[timerPulse_1s_ease-in-out_infinite]' : ''}`}>
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#2A2A3A" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none"
          stroke={isUrgent ? '#EF4444' : '#FFD700'} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-display text-4xl font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>{seconds}</span>
        <span className="text-xs text-gray-400">secs</span>
      </div>
    </div>
  );
}

function TeamCard({ team, isLeading }: { team: TeamWithPlayers; isLeading: boolean }) {
  const soldPlayers = team.players.filter(p => p.status === 'SOLD');
  const pct = team.purse > 0 ? (team.remainingPurse / team.purse) * 100 : 0;
  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 transition-all ${isLeading ? 'border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-[#2A2A3A]'}`}
      style={{ backgroundColor: isLeading ? `${team.color}22` : '#111118' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: team.color ?? '#6B7280' }} />
        <h3 className="font-display font-bold text-lg truncate">{team.name}</h3>
        {isLeading && <span className="ml-auto text-xs font-bold text-[#FFD700]">LEADING</span>}
      </div>
      <div className="h-1.5 rounded-full bg-[#2A2A3A] mb-2">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: team.color ?? '#FFD700' }} />
      </div>
      <div className="text-sm font-mono font-bold text-[#FFD700]">{team.remainingPurse}<span className="text-xs font-normal text-gray-400"> pts</span></div>
      <div className="text-xs text-gray-400 mb-3">{soldPlayers.length}/10 players</div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {soldPlayers.slice(-4).map(p => (
          <div key={p.id} className="flex items-center justify-between text-xs">
            <span className="truncate text-gray-300">{p.fullName}</span>
            <span className="font-mono text-[#FFD700] shrink-0 ml-1">{p.soldPrice}pt</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuctionLivePage() {
  const { state, timer } = useAuction({ role: 'viewer', sessionId: SESSION_ID });
  const [soldOverlay, setSoldOverlay] = useState<{ playerName: string; teamName: string; teamColor: string; price: number } | null>(null);
  const [unsoldOverlay, setUnsoldOverlay] = useState<string | null>(null);
  const prevBid = useRef<number>(0);
  const [bidAnim, setBidAnim] = useState(false);

  useEffect(() => {
    const onSold = (data: { player: { fullName: string } | null; team: { name: string; color: string | null } | null; soldPrice: number }) => {
      setSoldOverlay({ playerName: data.player?.fullName ?? '?', teamName: data.team?.name ?? '?', teamColor: data.team?.color ?? '#FFD700', price: data.soldPrice });
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors: [data.team?.color ?? '#FFD700', '#ffffff'] });
      setTimeout(() => setSoldOverlay(null), 5000);
    };
    const onUnsold = (data: { player: { fullName: string } | null }) => {
      setUnsoldOverlay(data.player?.fullName ?? '?');
      setTimeout(() => setUnsoldOverlay(null), 3000);
    };

    // Can't directly listen here, so we watch state changes
  }, []);

  // Bid animation
  useEffect(() => {
    const bid = state?.session?.currentBid;
    if (bid && bid !== prevBid.current) {
      setBidAnim(true);
      prevBid.current = bid;
      setTimeout(() => setBidAnim(false), 400);
    }
  }, [state?.session?.currentBid]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <Logo size="lg" />
      </div>
    );
  }

  const { session, currentPlayer, teams } = state;
  const bids = (session?.bids ?? []) as BidWithRelations[];
  const leadingTeamId = session?.currentLeaderTeamId;
  const roleClr = currentPlayer ? roleColor(currentPlayer.primaryRole) : '#6B7280';

  const [t1, t2, t3, t4] = teams as TeamWithPlayers[];

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0F] font-display select-none" style={{ fontFamily: 'var(--font-rajdhani)' }}>
      {/* Sold overlay */}
      {soldOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: `${soldOverlay.teamColor}44` }}>
          <div className="text-center">
            <div className="font-display text-8xl font-black text-white animate-[soldStamp_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] drop-shadow-2xl" style={{ color: soldOverlay.teamColor, WebkitTextStroke: '2px white', transform: 'rotate(-15deg)' }}>
              SOLD
            </div>
            <div className="mt-4 text-3xl font-bold text-white">{soldOverlay.playerName}</div>
            <div className="text-xl text-white/80">to {soldOverlay.teamName}</div>
            <div className="font-display text-5xl font-black text-[#FFD700] mt-2">{soldOverlay.price} pts</div>
          </div>
        </div>
      )}

      {/* Unsold overlay */}
      {unsoldOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center animate-[fadeIn_0.3s_ease-out]">
            <div className="font-display text-8xl font-black text-gray-400 drop-shadow-2xl">UNSOLD</div>
            <div className="mt-2 text-2xl text-gray-300">{unsoldOverlay}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2A2A3A] bg-[#111118] px-6 py-3">
        <Logo />
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${session?.status === 'LIVE' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {session?.status === 'LIVE' ? '● LIVE' : session?.status ?? 'IDLE'}
          </div>
          <TimerRing seconds={timer} total={session?.timerSeconds ?? 30} />
        </div>
      </header>

      {/* Main 4-quadrant grid */}
      <div className="flex flex-1 gap-3 p-4" style={{ minHeight: 0 }}>
        {/* Team 1 */}
        <div className="w-56 shrink-0">{t1 && <TeamCard team={t1} isLeading={t1.id === leadingTeamId} />}</div>

        {/* Center: Player + Bid */}
        <div className="flex flex-1 flex-col gap-3">
          {currentPlayer ? (
            <>
              {/* Player card */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-[#2A2A3A] bg-[#111118] p-4 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${roleClr} 0%, transparent 70%)` }} />

                <div className="relative z-10 text-center flex flex-col items-center gap-3">
                  <div className="relative h-36 w-36 overflow-hidden rounded-2xl" style={{ border: `3px solid ${roleClr}` }}>
                    {currentPlayer.photoUrl ? (
                      <Image src={currentPlayer.photoUrl} alt={currentPlayer.fullName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl font-bold" style={{ color: roleClr, background: `${roleClr}22` }}>
                        {currentPlayer.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <h1 className="font-display text-4xl font-black tracking-wide">{currentPlayer.fullName}</h1>
                    {currentPlayer.nickname && <p className="text-gray-400 text-lg">"{currentPlayer.nickname}"</p>}
                  </div>

                  <div className="flex gap-3 items-center">
                    <span className="rounded-lg px-3 py-1 text-base font-bold" style={{ color: roleClr, background: `${roleClr}22` }}>
                      {roleLabel(currentPlayer.primaryRole)}
                    </span>
                    <PlayerRatingBadge score={currentPlayer.acplRating} category={currentPlayer.acplCategory} size="lg" />
                  </div>

                  {/* Stats strip */}
                  <div className="flex gap-6 text-center">
                    {[
                      { label: 'RUNS', v: currentPlayer.runs },
                      { label: 'WICKETS', v: currentPlayer.wickets },
                      { label: 'SR', v: currentPlayer.strikeRate.toFixed(0) },
                      { label: 'ECO', v: currentPlayer.economyRate > 0 ? currentPlayer.economyRate.toFixed(1) : '—' },
                      { label: 'MoM', v: currentPlayer.momAwards },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="font-mono text-2xl font-bold text-white">{s.v}</div>
                        <div className="text-xs text-gray-400 tracking-widest">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current bid */}
              <div className="rounded-2xl border border-[#FFD700]/30 bg-[#111118] p-4 text-center">
                <div className="text-sm text-gray-400">{session?.currentBid ? 'CURRENT BID' : 'BASE PRICE'}</div>
                <div className={`font-display text-6xl font-black text-[#FFD700] leading-none my-1 ${bidAnim ? 'animate-[countUp_0.3s_ease-out]' : ''}`}>
                  {session?.currentBid ?? currentPlayer.basePrice}
                </div>
                <div className="text-gray-400">POINTS</div>
                {leadingTeamId && (
                  <div className="mt-1 text-sm text-gray-300">
                    Leading: <span style={{ color: teams.find(t => t.id === leadingTeamId)?.color ?? '#FFD700' }}>
                      {teams.find(t => t.id === leadingTeamId)?.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Bid history strip */}
              <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-3 max-h-36 overflow-y-auto">
                {bids.slice(0, 8).map((bid, i) => (
                  <div key={bid.id} className={`flex items-center justify-between py-1 text-sm ${i === 0 ? 'text-[#FFD700]' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: bid.team.color ?? '#6B7280' }} />
                      <span>{bid.team.name}</span>
                    </div>
                    <span className="font-mono font-bold">{bid.amount} pts</span>
                  </div>
                ))}
                {bids.length === 0 && <p className="text-center text-gray-500 text-xs py-2">No bids yet</p>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-[#2A2A3A] bg-[#111118]">
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-gray-500 mb-2">
                  {session?.status === 'COMPLETED' ? '🏆 AUCTION COMPLETE' : 'WAITING FOR NEXT PLAYER'}
                </div>
                <p className="text-gray-600">Admin will bring the next player on block</p>
              </div>
            </div>
          )}
        </div>

        {/* Teams 2,3,4 */}
        <div className="flex w-56 flex-col gap-3 shrink-0">
          {[t2, t3, t4].filter(Boolean).map(t => (
            <TeamCard key={t!.id} team={t!} isLeading={t!.id === leadingTeamId} />
          ))}
        </div>
      </div>
    </div>
  );
}
