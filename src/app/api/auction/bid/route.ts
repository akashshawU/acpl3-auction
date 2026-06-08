import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'CAPTAIN')
    return NextResponse.json({ success: false, error: 'Only captains can bid' }, { status: 403 });

  const { sessionId = 'default-session', amount } = await req.json();
  if (!amount || typeof amount !== 'number')
    return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });

  const teamId = authSession.user.teamId;
  if (!teamId)
    return NextResponse.json({ success: false, error: 'No team associated' }, { status: 400 });

  const session = await prisma.auctionSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== 'LIVE' || !session.currentPlayerId)
    return NextResponse.json({ success: false, error: 'Auction not live or no current player' }, { status: 400 });

  if (session.timerStartedAt) {
    const elapsed = (Date.now() - new Date(session.timerStartedAt).getTime()) / 1000;
    if (elapsed > session.timerSeconds)
      return NextResponse.json({ success: false, error: 'Timer expired' }, { status: 400 });
  }

  if (session.currentBid !== null && amount <= session.currentBid)
    return NextResponse.json({ success: false, error: 'Bid must exceed current bid' }, { status: 400 });

  await prisma.bid.updateMany({
    where: { sessionId, playerId: session.currentPlayerId, status: 'WINNING' },
    data: { status: 'OUTBID' },
  });

  const bid = await prisma.bid.create({
    data: { sessionId, playerId: session.currentPlayerId, teamId, amount, status: 'WINNING' },  // userId removed from schema
  });

  await prisma.auctionSession.update({
    where: { id: sessionId },
    data: { currentBid: amount, currentLeaderTeamId: teamId, timerStartedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { userId: authSession.user.id, sessionId, playerId: session.currentPlayerId, action: 'BID_PLACED', amount },
  });

  return NextResponse.json({ success: true, data: bid });
}
