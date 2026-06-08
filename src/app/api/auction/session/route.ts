import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? 'default-session';

  const session = await prisma.auctionSession.findUnique({
    where: { id },
    include: {
      bids: {
        where: { status: { in: ['WINNING', 'ACTIVE'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { team: true, player: true },
      },
    },
  });

  const [teams, currentPlayer] = await Promise.all([
    prisma.team.findMany({ include: { players: true }, orderBy: { name: 'asc' } }),
    session?.currentPlayerId
      ? prisma.player.findUnique({ where: { id: session.currentPlayerId } })
      : Promise.resolve(null),
  ]);

  // Compute timer from DB timestamp — works serverless
  let timerRemaining = 0;
  if (session?.status === 'LIVE' && session.timerStartedAt) {
    const elapsed = (Date.now() - new Date(session.timerStartedAt).getTime()) / 1000;
    timerRemaining = Math.max(0, Math.round(session.timerSeconds - elapsed));
  }

  return NextResponse.json({ success: true, data: { session, teams, currentPlayer, timerRemaining } });
}

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const schema = z.object({ name: z.string().optional(), timerSeconds: z.number().min(10).max(120), bidIncrement: z.number() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 });

  const session = await prisma.auctionSession.upsert({
    where: { id: 'default-session' },
    update: { ...parsed.data },
    create: { id: 'default-session', ...parsed.data, status: 'SCHEDULED' },
  });
  return NextResponse.json({ success: true, data: session });
}

export async function PATCH(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { action, sessionId = 'default-session' } = await req.json();

  const statusMap: Record<string, string> = { START: 'LIVE', PAUSE: 'PAUSED', RESUME: 'LIVE', END: 'COMPLETED' };
  const newStatus = statusMap[action];
  if (!newStatus) return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  const session = await prisma.auctionSession.update({
    where: { id: sessionId },
    data: {
      status: newStatus,
      ...(action === 'RESUME' ? { timerStartedAt: new Date() } : {}),
    },
  });
  await prisma.auditLog.create({ data: { userId: authSession.user.id, sessionId, action: `AUCTION_${action}` } });
  return NextResponse.json({ success: true, data: session });
}
