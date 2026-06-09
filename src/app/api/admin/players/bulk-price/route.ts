import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const BulkPriceSchema = z.object({
  playerIds: z.array(z.string()).min(1),
  basePrice: z.number().int().min(5).max(100),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = BulkPriceSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const result = await prisma.player.updateMany({
    where: {
      id:     { in: parsed.data.playerIds },
      status: { not: 'SOLD' },
    },
    data: { basePrice: parsed.data.basePrice },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'BASE_PRICE_BULK_SET',
      details: {
        playerIds: parsed.data.playerIds,
        basePrice: parsed.data.basePrice,
        count:     result.count,
      },
    },
  });

  return NextResponse.json({ success: true, data: { updated: result.count } });
}
