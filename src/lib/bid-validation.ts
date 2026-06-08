// src/lib/bid-validation.ts
// Pure validation logic — no prisma/server imports, safe for client bundles.
import type { Player, TeamWithPlayers } from '@/types';

export const MAX_SQUAD_SIZE = 10;
const MIN_WICKET_KEEPERS = 1;
const MIN_BOWLERS = 2;
const MIN_BATTERS = 2;
const MIN_ALL_ROUNDERS = 1;

export interface BidValidation {
  allowed: boolean;
  reason?: string;
}

export function canTeamBid(
  team: TeamWithPlayers,
  player: Player,
  bidAmount: number,
  _remainingPlayersInPool: number
): BidValidation {
  if (team.remainingPurse < bidAmount) {
    return { allowed: false, reason: `Insufficient budget (${team.remainingPurse} pts remaining)` };
  }

  if (team.players.length >= MAX_SQUAD_SIZE) {
    return { allowed: false, reason: 'Squad is full (10/10)' };
  }

  const hypotheticalPlayers = [...team.players, player];
  const slotsAfter = MAX_SQUAD_SIZE - hypotheticalPlayers.length;

  const wkCount     = hypotheticalPlayers.filter(p => p.primaryRole === 'WICKET_KEEPER').length;
  const bowlerCount = hypotheticalPlayers.filter(p => p.primaryRole === 'BOWLER').length;
  const batterCount = hypotheticalPlayers.filter(p => p.primaryRole === 'BATTER').length;
  const arCount     = hypotheticalPlayers.filter(p => p.primaryRole === 'ALL_ROUNDER').length;

  const totalNeeded =
    Math.max(0, MIN_WICKET_KEEPERS - wkCount) +
    Math.max(0, MIN_BOWLERS - bowlerCount) +
    Math.max(0, MIN_BATTERS - batterCount) +
    Math.max(0, MIN_ALL_ROUNDERS - arCount);

  if (totalNeeded > slotsAfter) {
    return { allowed: false, reason: `Can't fill minimum squad requirements with ${slotsAfter} slots left` };
  }

  return { allowed: true };
}
