import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { AuditLogTable } from '@/components/admin/AuditLog';
import { Users, CheckCircle, Trophy, Inbox, Shield, Gavel, BarChart3 } from 'lucide-react';

async function getStats() {
  const [total, approved, sold, unsold, teams, recentLogs] = await Promise.all([
    prisma.player.count(),
    prisma.player.count({ where: { status: 'APPROVED' } }),
    prisma.player.count({ where: { status: 'SOLD' } }),
    prisma.player.count({ where: { status: 'UNSOLD' } }),
    prisma.team.findMany({ include: { players: { where: { status: 'SOLD' } } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }, take: 20,
      include: { user: { select: { name: true } }, player: { select: { fullName: true } } },
    }),
  ]);
  return { total, approved, sold, unsold, teams, recentLogs };
}

export default async function AdminDashboard() {
  const { total, approved, sold, unsold, teams, recentLogs } = await getStats();

  const statCards = [
    { label: 'Total Players', value: total,    icon: Users,        color: 'text-blue-400'    },
    { label: 'In Queue',      value: approved,  icon: CheckCircle,  color: 'text-green-400'   },
    { label: 'Sold',          value: sold,      icon: Trophy,       color: 'text-[#FFD700]'   },
    { label: 'Unsold',        value: unsold,    icon: Inbox,        color: 'text-gray-400'    },
    { label: 'Teams',         value: teams.length, icon: Shield,    color: 'text-purple-400'  },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#FFD700]">Dashboard</h1>
        <p className="text-sm text-gray-400">ACPL 3 Auction Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map(s => (
          <div key={s.label} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
            <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-400">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/auction/control" className="flex items-center gap-2 rounded-lg bg-[#FFD700] px-4 py-2.5 font-bold text-black hover:bg-[#C9A227] transition-all">
            <Gavel className="h-4 w-4" /> Auction Control
          </Link>
          <Link href="/admin/players" className="flex items-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#111118] px-4 py-2.5 text-sm font-medium hover:bg-[#1A1A24] transition-all">
            <Users className="h-4 w-4" /> Manage Players
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-2 rounded-lg border border-[#2A2A3A] bg-[#111118] px-4 py-2.5 text-sm font-medium hover:bg-[#1A1A24] transition-all">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Link>
        </div>
      </div>

      {/* Team summary */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-400">Team Status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {teams.map(t => (
            <div key={t.id} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color ?? '#6B7280' }} />
                <span className="text-sm font-semibold">{t.name}</span>
              </div>
              <div className="text-xs text-gray-400">
                {t.players.length} players &middot; {t.remainingPurse}pts left
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2A2A3A]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(t.remainingPurse / t.purse) * 100}%`, backgroundColor: t.color ?? '#FFD700' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-400">Recent Activity</h2>
        <AuditLogTable logs={recentLogs} />
      </div>
    </div>
  );
}