import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
    include: { team: true, bids: { include: { team: true }, orderBy: { createdAt: 'desc' } } },
  });
  if (!player) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: player });
}

const UpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  nickname: z.string().optional(),
  status: z.enum(['APPROVED', 'UNSOLD']).optional(),
  basePrice: z.number().int().min(1).max(100).optional(),
  auctionOrder: z.number().int().min(1).optional(),
  primaryRole: z.string().optional(),
  battingStyle: z.string().optional(),
  bowlingStyle: z.string().optional(),
  matchesPlayed: z.number().optional(),
  runs: z.number().optional(),
  highestScore: z.number().optional(),
  battingAverage: z.number().optional(),
  strikeRate: z.number().optional(),
  wickets: z.number().optional(),
  economyRate: z.number().optional(),
  catches: z.number().optional(),
  runOuts: z.number().optional(),
  momAwards: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.player.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const d = parsed.data;
  const runs = d.runs ?? existing.runs;
  const wickets = d.wickets ?? existing.wickets;
  const strikeRate = d.strikeRate ?? existing.strikeRate;
  const economyRate = d.economyRate ?? existing.economyRate;
  const momAwards = d.momAwards ?? existing.momAwards;
  const raw = (runs / 10) + (wickets * 5) + (strikeRate / 10) +
    Math.max(0, (10 - economyRate) * 3) + (momAwards * 5);
  const acplRating = Math.min(100, Math.round(raw));
  const acplCategory = acplRating >= 85 ? 'Elite' : acplRating >= 75 ? 'A+' : acplRating >= 60 ? 'A' :
    acplRating >= 45 ? 'B+' : acplRating >= 30 ? 'B' : 'C';

  const player = await prisma.player.update({
    where: { id },
    data: { ...d, acplRating, acplCategory },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, playerId: id, action: 'PLAYER_EDITED' },
  });

  return NextResponse.json({ success: true, data: player });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.player.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
