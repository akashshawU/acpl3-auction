// src/app/(admin)/players/page.tsx
export const dynamic = 'force-dynamic';
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { PlayerRatingBadge } from '@/components/players/PlayerRatingBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { roleLabel, roleColor, statusColor, cn } from '@/lib/utils';
import type { Player } from '@/types';
import { CheckCircle, XCircle, Search, Filter } from 'lucide-react';

const STATUS_OPTIONS = ['', 'PENDING', 'APPROVED', 'SOLD', 'UNSOLD', 'REJECTED'];
const ROLE_OPTIONS = ['', 'BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (roleFilter) params.set('role', roleFilter);
    const res = await fetch(`/api/players?${params}`);
    const data = await res.json();
    if (data.success) setPlayers(data.data);
    setLoading(false);
  }, [statusFilter, roleFilter]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const filtered = players.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.nickname ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function updatePlayer(id: string, update: Record<string, unknown>, successMsg: string) {
    setActionLoading(id);
    const res = await fetch(`/api/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    setActionLoading(null);
    if (data.success) { toast.success(successMsg); fetchPlayers(); }
    else toast.error(data.error ?? 'Failed');
  }

  async function bulkApprove() {
    const ids = [...selected];
    await Promise.all(ids.map(id => updatePlayer(id, { status: 'APPROVED' }, '')));
    toast.success(`${ids.length} players approved`);
    setSelected(new Set());
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Players</h1>
          <p className="text-sm text-gray-400">{filtered.length} players</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={bulkApprove}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-all"
          >
            Approve {selected.size} selected
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search playersâ€¦"
            className="w-full rounded-lg border border-[#2A2A3A] bg-[#111118] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#2A2A3A] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <select
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[#2A2A3A] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
        >
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : (
        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A3A] bg-[#1A1A24]">
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.filter(p => p.status === 'PENDING').length && selected.size > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.filter(p => p.status === 'PENDING').map(p => p.id)) : new Set())}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-3 font-medium text-gray-400">Player</th>
                <th className="text-left p-3 font-medium text-gray-400">Role</th>
                <th className="text-left p-3 font-medium text-gray-400">Rating</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
                <th className="text-left p-3 font-medium text-gray-400">Base Price</th>
                <th className="text-left p-3 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(player => {
                const roleClr = roleColor(player.primaryRole);
                return (
                  <tr key={player.id} className="border-b border-[#2A2A3A]/50 hover:bg-[#1A1A24] transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(player.id)}
                        onChange={e => {
                          const s = new Set(selected);
                          e.target.checked ? s.add(player.id) : s.delete(player.id);
                          setSelected(s);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-[#2A2A3A] shrink-0">
                          {player.photoUrl ? (
                            <Image src={player.photoUrl} alt={player.fullName} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold" style={{ color: roleClr }}>
                              {player.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{player.fullName}</div>
                          {player.nickname && <div className="text-xs text-gray-500">"{player.nickname}"</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ color: roleClr, backgroundColor: `${roleClr}22` }}>
                        {roleLabel(player.primaryRole)}
                      </span>
                    </td>
                    <td className="p-3">
                      <PlayerRatingBadge score={player.acplRating} category={player.acplCategory} size="sm" />
                    </td>
                    <td className="p-3">
                      <span className={cn('rounded px-2 py-0.5 text-xs font-medium', statusColor(player.status))}>
                        {player.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#FFD700]">{player.basePrice}pt</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {player.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updatePlayer(player.id, { status: 'APPROVED' }, `${player.fullName} approved`)}
                              disabled={actionLoading === player.id}
                              className="rounded p-1.5 text-green-400 hover:bg-green-400/10 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updatePlayer(player.id, { status: 'REJECTED' }, `${player.fullName} rejected`)}
                              disabled={actionLoading === player.id}
                              className="rounded p-1.5 text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <Link href={`/admin/players/${player.id}`} className="rounded px-2 py-1 text-xs border border-[#2A2A3A] hover:bg-[#2A2A3A] transition-colors">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-500">No players found</div>
          )}
        </div>
      )}
    </div>
  );
}