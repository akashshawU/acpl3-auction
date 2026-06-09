import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const UpdateTeamSchema = z.object({
  name:    z.string().min(1).max(50).optional(),
  color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional().nullable(),
  purse:   z.number().int().min(10).max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateTeamSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });

  const updateData: Record<string, unknown> = { ...parsed.data };
  // Empty string logoUrl → null
  if (updateData.logoUrl === '') updateData.logoUrl = null;

  const updated = await prisma.team.update({ where: { id }, data: updateData });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'TEAM_UPDATED',
      details: { teamId: id, changes: parsed.data },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
