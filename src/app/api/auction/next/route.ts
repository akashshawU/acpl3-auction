import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { sessionId = 'default-session' } = await req.json();

  const session = await prisma.auctionSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status === 'COMPLETED')
    return NextResponse.json({ success: false, error: 'Session not active' }, { status: 400 });

  const nextPlayer = await prisma.player.findFirst({
    where: { status: 'APPROVED', auctionOrder: { not: null } },
    orderBy: { auctionOrder: 'asc' },
  });
  if (!nextPlayer)
    return NextResponse.json({ success: false, error: 'No more players in queue' }, { status: 404 });

  await prisma.auctionSession.update({
    where: { id: sessionId },
    data: {
      currentPlayerId: nextPlayer.id,
      currentBid: null,
      currentLeaderTeamId: null,
      status: 'LIVE',
      timerStartedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: { userId: authSession.user.id, sessionId, playerId: nextPlayer.id, action: 'PLAYER_UP' },
  });

  return NextResponse.json({ success: true, data: nextPlayer });
}
