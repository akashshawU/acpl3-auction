import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? undefined;
  const role = searchParams.get('role') ?? undefined;
  const category = searchParams.get('category') ?? undefined;

  const players = await prisma.player.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(role ? { primaryRole: role } : {}),
      ...(category ? { acplCategory: category } : {}),
    },
    include: { team: true },
    orderBy: [{ auctionOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ success: true, data: players });
}

const AddPlayerSchema = z.object({
  fullName: z.string().min(2),
  nickname: z.string().optional(),
  primaryRole: z.enum(['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']),
  battingStyle: z.enum(['RIGHT_HAND', 'LEFT_HAND']),
  bowlingStyle: z.string(),
  matchesPlayed: z.number().default(0),
  runs: z.number().default(0),
  highestScore: z.number().default(0),
  battingAverage: z.number().default(0),
  strikeRate: z.number().default(0),
  wickets: z.number().default(0),
  bestBowlingFigures: z.string().optional(),
  economyRate: z.number().default(0),
  catches: z.number().default(0),
  runOuts: z.number().default(0),
  momAwards: z.number().default(0),
  basePrice: z.number().default(10),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = AddPlayerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const p = parsed.data;
  const raw = (p.runs / 10) + (p.wickets * 5) + (p.strikeRate / 10) +
    Math.max(0, (10 - p.economyRate) * 3) + (p.momAwards * 5);
  const acplRating = Math.min(100, Math.round(raw));
  const acplCategory = acplRating >= 85 ? 'Elite' : acplRating >= 75 ? 'A+' : acplRating >= 60 ? 'A' :
    acplRating >= 45 ? 'B+' : acplRating >= 30 ? 'B' : 'C';

  const maxOrder = await prisma.player.aggregate({ _max: { auctionOrder: true } });

  const player = await prisma.player.create({
    data: { ...p, status: 'APPROVED', acplRating, acplCategory, auctionOrder: (maxOrder._max.auctionOrder ?? 0) + 1 },
  });

  return NextResponse.json({ success: true, data: player }, { status: 201 });
}
