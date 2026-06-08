import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { players: true, users: { where: { role: 'CAPTAIN' } } },
  });
  if (!team) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: team });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { name, color, purse } = await req.json();
  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (color) data.color = color;
  if (purse !== undefined) { data.purse = purse; data.remainingPurse = purse; }

  const team = await prisma.team.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: team });
}
