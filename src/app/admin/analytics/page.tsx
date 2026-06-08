// src/app/(admin)/analytics/page.tsx
import { prisma } from '@/lib/prisma';
import type { Player } from '@/types';
import { AnalyticsCharts } from './AnalyticsCharts';

async function getData() {
  const [teams, allPlayers, session] = await Promise.all([
    prisma.team.findMany({ include: { players: true }, orderBy: { name: 'asc' } }),
    prisma.player.findMany({ orderBy: [{ soldPrice: 'desc' }] }),
    prisma.auctionSession.findUnique({ where: { id: 'default-session' } }),
  ]);

  const soldPlayers = allPlayers.filter((p: Player) => p.status === 'SOLD');
  const unsoldPlayers = allPlayers.filter((p: Player) => p.status === 'UNSOLD');
  const totalSpent = soldPlayers.reduce((s: number, p: Player) => s + (p.soldPrice ?? 0), 0);
  const avgPrice = soldPlayers.length > 0 ? Math.round(totalSpent / soldPlayers.length) : 0;

  const mostExpensiveByRole = ['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'].map(role => {
    const player = soldPlayers.filter((p: Player) => p.primaryRole === (role as Player['primaryRole'])).sort((a: Player, b: Player) => (b.soldPrice ?? 0) - (a.soldPrice ?? 0))[0];
    return { role, player: player ?? null };
  });

  return { teams, allPlayers, soldPlayers, unsoldPlayers, totalSpent, avgPrice, mostExpensiveByRole };
}

export default async function AnalyticsPage() {
  const data = await getData();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <AnalyticsCharts {...data} />
    </div>
  );
}
