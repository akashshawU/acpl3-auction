import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession || authSession.user.role !== 'SUPER_ADMIN')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nuclear          = !!body.nuclear;
  const resetAssignments = !!body.resetAssignments;

  // ── Nuclear reset: wipe everything back to PENDING ─────────────────────────
  if (nuclear) {
    // All non-DELETED players → PENDING, clear squad assignments
    await prisma.player.updateMany({
      where: { status: { not: 'DELETED' } },
      data: { status: 'PENDING', teamId: null, soldPrice: null },
    });

    // Reset every team's purse to their configured maximum
    const allTeams = await prisma.team.findMany({ select: { id: true, purse: true } });
    await prisma.$transaction(
      allTeams.map(team =>
        prisma.team.update({
          where: { id: team.id },
          data: { remainingPurse: team.purse },
        }),
      ),
    );

    await prisma.auditLog.create({
      data: {
        userId: authSession.user.id,
        action: 'NUCLEAR_RESET',
        details: {
          message: 'All players reset to PENDING, all squad assignments cleared, all team budgets restored',
        },
      },
    });

    return NextResponse.json({ success: true });
  }

  // ── Partial reset ───────────────────────────────────────────────────────────
  // Reset UNSOLD players back to APPROVED
  await prisma.player.updateMany({
    where: { status: 'UNSOLD' },
    data: { status: 'APPROVED' },
  });

  // Reset each team's purse to their configured maximum
  const teams = await prisma.team.findMany();
  for (const team of teams) {
    await prisma.team.update({
      where: { id: team.id },
      data: { remainingPurse: team.purse },
    });
  }

  // Full reset — also wipe sold assignments
  if (resetAssignments) {
    await prisma.player.updateMany({
      where: { status: 'SOLD' },
      data: { status: 'APPROVED', teamId: null, soldPrice: null },
    });
    await prisma.team.updateMany({
      where: {},
      data: { remainingPurse: 100 },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: authSession.user.id,
      action: 'AUCTION_RESET',
      details: { resetAssignments },
    },
  });

  return NextResponse.json({ success: true });
}
