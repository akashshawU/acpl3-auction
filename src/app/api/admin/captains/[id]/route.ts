// PATCH /api/admin/captains/[id]
// [id] = User.id of the captain (captain = User with role='CAPTAIN')
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const UpdateCaptainSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateCaptainSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  // Verify the user exists and is a CAPTAIN
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'CAPTAIN')
    return NextResponse.json({ success: false, error: 'Captain not found' }, { status: 404 });

  const userUpdate: Record<string, string> = {};
  if (parsed.data.name)     userUpdate.name     = parsed.data.name;
  if (parsed.data.email)    userUpdate.email    = parsed.data.email;
  if (parsed.data.password) userUpdate.password = await bcrypt.hash(parsed.data.password, 12);

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id }, data: userUpdate });
  }

  await prisma.auditLog.create({
    data: {
      userId: authSession.user.id,
      action: 'CAPTAIN_UPDATED',
      details: {
        captainUserId: id,
        changes: {
          name:            parsed.data.name,
          email:           parsed.data.email,
          passwordChanged: !!parsed.data.password,
        },
      },
    },
  });

  return NextResponse.json({ success: true });
}
