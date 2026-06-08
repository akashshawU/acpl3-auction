// src/app/(admin)/analytics/AnalyticsCharts.tsx
'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { Player, Team } from '@/types';

interface Props {
  teams: (Team & { players: Player[] })[];
  allPlayers: Player[];
  soldPlayers: Player[];
  unsoldPlayers: Player[];
  totalSpent: number;
  avgPrice: number;
  mostExpensiveByRole: { role: string; player: Player | null }[];
}

const COLORS = ['#FFD700', '#3B82F6', '#EF4444', '#10B981'];

export function AnalyticsCharts({ teams, soldPlayers, unsoldPlayers, totalSpent, avgPrice, mostExpensiveByRole, allPlayers }: Props) {
  const teamSpendData = teams.map(t => ({
    name: t.name,
    Spent: t.purse - t.remainingPurse,
    Remaining: t.remainingPurse,
    color: t.color ?? '#6B7280',
  }));

  const roleDist = ['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'].map(r => ({
    name: r.replace('_', ' '),
    value: soldPlayers.filter(p => p.primaryRole === r).length,
  }));

  const top10 = soldPlayers.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Spent', value: `${totalSpent} pts` },
          { label: 'Avg Price', value: `${avgPrice} pts` },
          { label: 'Players Sold', value: soldPlayers.length },
          { label: 'Players Unsold', value: unsoldPlayers.length },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4 text-center">
            <div className="text-2xl font-bold text-[#FFD700]">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Most Expensive by Role */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
        <h2 className="mb-3 font-semibold">Most Expensive by Role</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mostExpensiveByRole.map(({ role, player }) => (
            <div key={role} className="rounded-lg bg-[#1A1A24] p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{role.replace('_', ' ')}</div>
              {player ? (
                <>
                  <div className="font-semibold text-sm">{player.fullName}</div>
                  <div className="font-mono text-[#FFD700] font-bold">{player.soldPrice} pts</div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">No sold player</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team Spending Bar Chart */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
        <h2 className="mb-3 font-semibold">Team Budget Utilization</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={teamSpendData}>
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2A2A3A', color: '#fff' }} />
            <Bar dataKey="Spent" fill="#FFD700" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Remaining" fill="#2A2A3A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role Distribution Pie */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
          <h2 className="mb-3 font-semibold">Sold Players by Role</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {roleDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2A2A3A', color: '#fff' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 leaderboard */}
        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
          <h2 className="mb-3 font-semibold">Top 10 Most Expensive</h2>
          <div className="space-y-1.5">
            {top10.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-xs font-mono text-gray-500">{i + 1}</span>
                <span className="flex-1 truncate">{p.fullName}</span>
                <span className="font-mono font-bold text-[#FFD700]">{p.soldPrice}pt</span>
              </div>
            ))}
            {top10.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No sold players yet</p>}
          </div>
        </div>
      </div>

      {/* Unsold Analysis */}
      {unsoldPlayers.length > 0 && (
        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4">
          <h2 className="mb-3 font-semibold">Unsold Players ({unsoldPlayers.length})</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'].map(r => {
              const count = unsoldPlayers.filter(p => p.primaryRole === r).length;
              return (
                <div key={r} className="rounded-lg bg-[#1A1A24] p-3 text-center">
                  <div className="text-2xl font-bold text-gray-400">{count}</div>
                  <div className="text-xs text-gray-500">{r.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
