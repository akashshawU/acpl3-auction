import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET() {
  const teams = await prisma.team.findMany({
    include: { players: true, users: { where: { role: 'CAPTAIN' } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ success: true, data: teams });
}

const TeamSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  purse: z.number().default(100),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = TeamSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const team = await prisma.team.create({
    data: { name: parsed.data.name, color: parsed.data.color, purse: parsed.data.purse, remainingPurse: parsed.data.purse },
  });
  return NextResponse.json({ success: true, data: team }, { status: 201 });
}
