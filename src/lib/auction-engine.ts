// Server-only — uses prisma. Do NOT import in client components.
import { prisma } from './prisma';
import type { Player, TeamWithPlayers } from '@/types';
import { canTeamBid } from './bid-validation';
export { canTeamBid };

export async function getNextPlayerInQueue(): Promise<Player | null> {
  return prisma.player.findFirst({
    where: { status: 'APPROVED', auctionOrder: { not: null } },
    orderBy: { auctionOrder: 'asc' },
  });
}

export async function getUnsoldPlayers(): Promise<Player[]> {
  return prisma.player.findMany({
    where: { status: 'UNSOLD' },
    orderBy: { fullName: 'asc' },
  });
}

export async function validateAndPlaceBid(params: {
  sessionId: string;
  playerId: string;
  teamId: string;
  userId: string;
  amount: number;
}): Promise<{ success: boolean; error?: string; bid?: object }> {
  const { sessionId, playerId, teamId, userId, amount } = params;

  const [session, player, team] = await Promise.all([
    prisma.auctionSession.findUnique({ where: { id: sessionId } }),
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.team.findUnique({ where: { id: teamId }, include: { players: true } }),
  ]);

  if (!session) return { success: false, error: 'Session not found' };
  if (session.status !== 'LIVE') return { success: false, error: 'Auction is not live' };
  if (session.currentPlayerId !== playerId) return { success: false, error: 'Wrong player on block' };
  if (!player) return { success: false, error: 'Player not found' };
  if (!team) return { success: false, error: 'Team not found' };

  const expectedBid = (session.currentBid ?? (player.basePrice - session.bidIncrement)) + session.bidIncrement;
  if (amount !== expectedBid)
    return { success: false, error: `Invalid bid amount. Expected ${expectedBid}` };

  const teamWithPlayers = team as TeamWithPlayers;
  const remainingPlayers = await prisma.player.count({ where: { status: 'APPROVED' } });
  const validation = canTeamBid(teamWithPlayers, player, amount, remainingPlayers);
  if (!validation.allowed) return { success: false, error: validation.reason };

  const bid = await prisma.$transaction(async tx => {
    await tx.bid.updateMany({ where: { sessionId, playerId, status: 'WINNING' }, data: { status: 'OUTBID' } });
    const newBid = await tx.bid.create({
      data: { sessionId, playerId, teamId, amount, status: 'WINNING' },
      include: { team: true, player: true },
    });
    await tx.auctionSession.update({
      where: { id: sessionId },
      data: { currentBid: amount, currentLeaderTeamId: teamId, timerStartedAt: new Date() },
    });
    await tx.auditLog.create({ data: { sessionId, playerId, userId, action: 'BID_PLACED', amount } });
    return newBid;
  });

  return { success: true, bid };
}
