import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { sessionId = 'default-session' } = await req.json();

  const session = await prisma.auctionSession.findUnique({ where: { id: sessionId } });
  if (!session?.currentPlayerId || !session.currentBid || !session.currentLeaderTeamId)
    return NextResponse.json({ success: false, error: 'No active bid to sell' }, { status: 400 });

  await prisma.$transaction([
    prisma.player.update({
      where: { id: session.currentPlayerId },
      data: { status: 'SOLD', soldPrice: session.currentBid, teamId: session.currentLeaderTeamId, auctionOrder: null },
    }),
    prisma.team.update({
      where: { id: session.currentLeaderTeamId },
      data: { remainingPurse: { decrement: session.currentBid } },
    }),
    prisma.bid.updateMany({
      where: { sessionId, playerId: session.currentPlayerId, status: 'WINNING' },
      data: { status: 'ACTIVE' },
    }),
    prisma.auctionSession.update({
      where: { id: sessionId },
      data: { currentPlayerId: null, currentBid: null, currentLeaderTeamId: null, timerStartedAt: null },
    }),
    prisma.auditLog.create({
      data: {
        userId: authSession.user.id,
        sessionId,
        playerId: session.currentPlayerId,
        action: 'PLAYER_SOLD',
        amount: session.currentBid,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
