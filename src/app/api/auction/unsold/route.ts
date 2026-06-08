import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { sessionId = 'default-session', reintroduce = false, playerId: explicitPlayerId } = await req.json();

  if (reintroduce && explicitPlayerId) {
    const maxOrder = await prisma.player.aggregate({ _max: { auctionOrder: true } });
    await prisma.player.update({
      where: { id: explicitPlayerId },
      data: { status: 'APPROVED', auctionOrder: (maxOrder._max.auctionOrder ?? 0) + 1 },
    });
    await prisma.auditLog.create({
      data: { userId: authSession.user.id, sessionId, playerId: explicitPlayerId, action: 'PLAYER_REINTRODUCED' },
    });
    return NextResponse.json({ success: true });
  }

  const session = await prisma.auctionSession.findUnique({ where: { id: sessionId } });
  if (!session?.currentPlayerId)
    return NextResponse.json({ success: false, error: 'No current player' }, { status: 400 });

  await prisma.$transaction([
    prisma.player.update({
      where: { id: session.currentPlayerId },
      data: { status: 'UNSOLD', auctionOrder: null },
    }),
    prisma.bid.updateMany({
      where: { sessionId, playerId: session.currentPlayerId },
      data: { status: 'CANCELLED' },
    }),
    prisma.auctionSession.update({
      where: { id: sessionId },
      data: { currentPlayerId: null, currentBid: null, currentLeaderTeamId: null, timerStartedAt: null },
    }),
    prisma.auditLog.create({
      data: { userId: authSession.user.id, sessionId, playerId: session.currentPlayerId, action: 'PLAYER_UNSOLD' },
    }),
  ]);

  return NextResponse.json({ success: true });
}
