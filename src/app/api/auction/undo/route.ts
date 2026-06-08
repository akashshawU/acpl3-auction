import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { sessionId = 'default-session' } = await req.json();

  const session = await prisma.auctionSession.findUnique({ where: { id: sessionId } });
  if (!session?.currentPlayerId)
    return NextResponse.json({ success: false, error: 'No current player' }, { status: 400 });

  const lastBid = await prisma.bid.findFirst({
    where: { sessionId, playerId: session.currentPlayerId, status: 'WINNING' },
    orderBy: { createdAt: 'desc' },
  });
  if (!lastBid)
    return NextResponse.json({ success: false, error: 'No bid to undo' }, { status: 400 });

  const prevBid = await prisma.bid.findFirst({
    where: { sessionId, playerId: session.currentPlayerId, status: 'OUTBID', createdAt: { lt: lastBid.createdAt } },
    orderBy: { createdAt: 'desc' },
  });

  await prisma.$transaction([
    prisma.bid.update({ where: { id: lastBid.id }, data: { status: 'CANCELLED' } }),
    ...(prevBid ? [prisma.bid.update({ where: { id: prevBid.id }, data: { status: 'WINNING' } })] : []),
    prisma.auctionSession.update({
      where: { id: sessionId },
      data: {
        currentBid: prevBid?.amount ?? null,
        currentLeaderTeamId: prevBid?.teamId ?? null,
        timerStartedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: authSession.user.id,
        sessionId,
        playerId: session.currentPlayerId,
        action: 'BID_UNDONE',
        amount: lastBid.amount,
      },
    }),
  ]);

  return NextResponse.json({ success: true, data: { undone: lastBid.amount, restored: prevBid?.amount } });
}
