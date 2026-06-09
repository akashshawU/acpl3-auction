'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { roleLabel, roleColor, statusColor, cn } from '@/lib/utils';
import type { Player } from '@/types';
import {
  Search, Upload, BarChart2,
  ArrowUpDown, Plus, Trash2, X, Pencil,
} from 'lucide-react';

// ─── Inline base-price cell ───────────────────────────────────────────────────

function BasePriceCell({ player, onSave }: { player: Player; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(player.basePrice);
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (value === player.basePrice) { setEditing(false); return; }
    setSaving(true);
    try {
      const res  = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Failed');
      onSave();
      setEditing(false);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to update base price');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(player.basePrice); setEditing(true); }}
        className="flex items-center gap-1.5 group"
        title="Click to edit base price"
        disabled={player.status === 'SOLD'}
      >
        <span className="font-mono font-bold text-[#FFD700]">{player.basePrice}pt</span>
        {player.status !== 'SOLD' && (
          <Pencil className="h-3 w-3 text-gray-600 group-hover:text-[#FFD700] transition-colors" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={e => setValue(parseInt(e.target.value) || 0)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        min={5}
        max={100}
        autoFocus
        className="w-16 bg-[#1A1A24] border border-[#FFD700]/50 rounded px-2 py-1 text-white text-sm focus:outline-none"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs text-[#FFD700] hover:text-white px-1 transition-colors"
      >
        {saving ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-gray-600 hover:text-red-400 px-1 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

const STATUS_OPTIONS = ['', 'PENDING', 'APPROVED', 'SOLD', 'UNSOLD', 'REJECTED'];
const ROLE_OPTIONS   = ['', 'BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];
const BOWLING_STYLES = [
  'Right Arm Fast', 'Right Arm Medium', 'Right Arm Off Spin', 'Right Arm Leg Spin',
  'Left Arm Fast', 'Left Arm Medium', 'Left Arm Orthodox', 'Left Arm Wrist Spin',
  'Does Not Bowl', 'N/A',
];

type SortField = 'name' | 'mvp';
type SortDir   = 'asc' | 'desc';

const EMPTY_FORM = {
  fullName: '', nickname: '', mobileNumber: '', whatsappNumber: '',
  primaryRole: 'BATTER', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Medium',
  preferredBattingPosition: '', preferredBowlingPhase: '',
  strengths: '', bio: '',
  basePrice: 10, status: 'APPROVED', auctionOrder: '',
};

export default function AdminPlayersPage() {
  const [players, setPlayers]           = useState<Player[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [customPrice, setCustomPrice]     = useState(10);
  const [sortField, setSortField]       = useState<SortField>('mvp');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    playerId: string;
    playerName: string;
    deleting: boolean;
  } | null>(null);

  // Add Player panel state
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState({ ...EMPTY_FORM });
  const [addSaving, setAddSaving] = useState(false);

  const fetchPlayers = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (roleFilter)   params.set('role', roleFilter);
    const res  = await fetch(`/api/players?${params}`);
    const data = await res.json();
    if (data.success) setPlayers(data.data);
    setLoading(false);
  }, [statusFilter, roleFilter]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const filtered = players
    .filter(p =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.nickname ?? '').toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortField === 'mvp') {
        const aR = a.performance?.rankInMVPLeaderboard ?? 999;
        const bR = b.performance?.rankInMVPLeaderboard ?? 999;
        // 0 = unranked → push to end
        const aEff = aR === 0 ? 9999 : aR;
        const bEff = bR === 0 ? 9999 : bR;
        return sortDir === 'asc' ? aEff - bEff : bEff - aEff;
      }
      return sortDir === 'desc'
        ? b.fullName.localeCompare(a.fullName)
        : a.fullName.localeCompare(b.fullName);
    });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  async function updatePlayer(id: string, update: Record<string, unknown>, successMsg: string) {
    setActionLoading(id);
    const res  = await fetch(`/api/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    setActionLoading(null);
    if (data.success) { toast.success(successMsg); fetchPlayers(); }
    else toast.error(data.error ?? 'Failed');
  }

  async function handleStatusChange(playerId: string, newStatus: 'APPROVED' | 'PENDING' | 'REJECTED') {
    const res  = await fetch(`/api/players/${playerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!data.success) { toast.error(data.error ?? 'Status update failed'); return; }
    toast.success(`Player ${newStatus.toLowerCase()}`);
    fetchPlayers();
  }

  async function bulkStatusChange(newStatus: 'APPROVED' | 'PENDING' | 'REJECTED') {
    const ids = [...selected];
    await Promise.all(ids.map(id => handleStatusChange(id, newStatus)));
    toast.success(`${ids.length} players → ${newStatus.toLowerCase()}`);
    setSelected(new Set());
  }

  async function handleBulkBasePrice(price: number) {
    const ids = selected.size > 0
      ? [...selected]
      : players.filter(p => p.status === 'APPROVED').map(p => p.id);
    if (ids.length === 0) { toast.error('No players to update'); return; }
    const res  = await fetch('/api/admin/players/bulk-price', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds: ids, basePrice: price }),
    });
    const data = await res.json();
    if (!data.success) { toast.error(typeof data.error === 'string' ? data.error : 'Bulk update failed'); return; }
    toast.success(`Base price set to ${price} pts for ${data.data.updated} players`);
    fetchPlayers();
  }

  async function confirmDelete() {
    if (!deleteDialog) return;
    setDeleteDialog(d => d ? { ...d, deleting: true } : null);
    const res = await fetch(`/api/admin/players/${deleteDialog.playerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hard: false }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`${deleteDialog.playerName} removed`);
      setDeleteDialog(null);
      fetchPlayers();
    } else {
      toast.error(data.error ?? 'Delete failed');
      setDeleteDialog(d => d ? { ...d, deleting: false } : null);
    }
  }

  async function submitAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    const res  = await fetch('/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName:                 addForm.fullName.trim(),
        nickname:                 addForm.nickname.trim() || null,
        mobileNumber:             addForm.mobileNumber.trim() || null,
        whatsappNumber:           addForm.whatsappNumber.trim() || null,
        primaryRole:              addForm.primaryRole,
        battingStyle:             addForm.battingStyle,
        bowlingStyle:             addForm.bowlingStyle,
        preferredBattingPosition: addForm.preferredBattingPosition
          ? parseInt(addForm.preferredBattingPosition as string)
          : null,
        preferredBowlingPhase: addForm.preferredBowlingPhase || null,
        strengths:  addForm.strengths.trim() || null,
        bio:        addForm.bio.trim() || null,
        basePrice:  addForm.basePrice,
        status:     addForm.status,
        auctionOrder: addForm.auctionOrder
          ? parseInt(addForm.auctionOrder as string)
          : null,
      }),
    });
    const data = await res.json();
    setAddSaving(false);
    if (data.success) {
      toast.success('Player added successfully');
      setShowAdd(false);
      setAddForm({ ...EMPTY_FORM });
      fetchPlayers();
    } else {
      toast.error(typeof data.error === 'string' ? data.error : 'Validation failed');
    }
  }

  const inputCls =
    'w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2 text-sm text-white outline-none focus:border-[#FFD700] transition-colors';
  const labelCls = 'mb-1 block text-xs text-gray-400';

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Players</h1>
          <p className="text-sm text-gray-400">{filtered.length} players</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#FFD700] px-4 py-2 text-sm font-bold text-black hover:bg-[#C9A227] transition-all"
          >
            <Plus className="h-4 w-4" /> Add Player
          </button>
          <Link
            href="/admin/players/import"
            className="flex items-center gap-1.5 rounded-lg border border-[#FFD700]/40 px-4 py-2 text-sm font-medium text-[#FFD700] hover:bg-[#FFD700]/10 transition-all"
          >
            <Upload className="h-4 w-4" /> Import Stats
          </Link>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1A1A24] rounded-xl border border-[#2A2A3A]">
          <span className="text-sm text-gray-400">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => bulkStatusChange('APPROVED')}
              className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors"
            >
              ✓ Approve All
            </button>
            <button
              onClick={() => bulkStatusChange('REJECTED')}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
            >
              ✕ Reject All
            </button>
            <button
              onClick={() => bulkStatusChange('PENDING')}
              className="px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-medium hover:bg-yellow-500/25 transition-colors"
            >
              ⏳ Pending All
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 rounded-lg bg-[#2A2A3A] text-gray-400 text-xs hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Bulk base price toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 bg-[#111118] rounded-xl border border-[#2A2A3A]">
        <span className="text-xs text-gray-500 shrink-0">Set base price:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {[5, 10, 15, 20, 25].map(price => (
            <button
              key={price}
              onClick={() => handleBulkBasePrice(price)}
              className="px-2.5 py-1 rounded-lg bg-[#1A1A24] text-xs text-gray-400 hover:bg-[#FFD700]/10 hover:text-[#FFD700] border border-transparent hover:border-[#FFD700]/20 transition-colors"
            >
              {price}
            </button>
          ))}
          <div className="flex items-center gap-0 border border-[#2A2A3A] rounded-lg overflow-hidden">
            <input
              type="number"
              value={customPrice}
              onChange={e => setCustomPrice(parseInt(e.target.value) || 5)}
              min={5}
              max={100}
              placeholder="Custom"
              className="w-16 bg-[#1A1A24] px-2 py-1 text-xs text-white focus:outline-none border-r border-[#2A2A3A]"
            />
            <button
              onClick={() => handleBulkBasePrice(customPrice)}
              className="px-2 py-1 bg-[#FFD700]/10 text-[#FFD700] text-xs hover:bg-[#FFD700]/20 transition-colors"
            >
              Set
            </button>
          </div>
        </div>
        <span className="text-xs text-gray-600 ml-1">
          {selected.size > 0 ? `for ${selected.size} selected` : 'for all approved'}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players…"
            className="w-full rounded-lg border border-[#2A2A3A] bg-[#111118] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#2A2A3A] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[#2A2A3A] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
        >
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : (
        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-[#2A2A3A] bg-[#1A1A24]">
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === filtered.filter(p => p.status === 'PENDING').length &&
                      selected.size > 0
                    }
                    onChange={e =>
                      setSelected(
                        e.target.checked
                          ? new Set(filtered.filter(p => p.status === 'PENDING').map(p => p.id))
                          : new Set(),
                      )
                    }
                    className="rounded"
                  />
                </th>
                <th
                  className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Player <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-left p-3 font-medium text-gray-400">Role</th>
                <th
                  className="text-left p-3 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('mvp')}
                >
                  <span className="flex items-center gap-1">
                    MVP Rank <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-left p-3 font-medium text-gray-400">Bat#</th>
                <th className="text-left p-3 font-medium text-gray-400">Bowl#</th>
                <th className="text-left p-3 font-medium text-gray-400">Status</th>
                <th className="text-left p-3 font-medium text-gray-400">Base</th>
                <th className="text-left p-3 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(player => {
                const roleClr    = roleColor(player.primaryRole);
                const perf       = player.performance;
                const statsMissing = player.status === 'APPROVED' && !perf;

                return (
                  <tr
                    key={player.id}
                    className="border-b border-[#2A2A3A]/50 hover:bg-[#1A1A24] transition-colors"
                  >
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
                            <div
                              className="flex h-full w-full items-center justify-center text-xs font-bold"
                              style={{ color: roleClr }}
                            >
                              {player.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{player.fullName}</div>
                          {player.nickname && (
                            <div className="text-xs text-gray-500">"{player.nickname}"</div>
                          )}
                          {statsMissing && (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 mt-0.5">
                              Stats Missing
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{ color: roleClr, backgroundColor: `${roleClr}22` }}
                      >
                        {roleLabel(player.primaryRole)}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-300 font-mono">
                      {perf?.rankInMVPLeaderboard
                        ? `#${perf.rankInMVPLeaderboard}`
                        : '—'}
                    </td>
                    <td className="p-3 text-xs text-gray-400">
                      {perf?.rankInBattingLeaderboard
                        ? `#${perf.rankInBattingLeaderboard}`
                        : '—'}
                    </td>
                    <td className="p-3 text-xs text-gray-400">
                      {perf?.rankInBowlingLeaderboard
                        ? `#${perf.rankInBowlingLeaderboard}`
                        : '—'}
                    </td>
                    <td className="p-3">
                      <span className={cn('rounded px-2 py-0.5 text-xs font-medium', statusColor(player.status))}>
                        {player.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <BasePriceCell player={player} onSave={fetchPlayers} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {player.status !== 'SOLD' && player.status !== 'DELETED' && (
                          <div className="flex items-center gap-0.5">
                            {(
                              [
                                { value: 'APPROVED', label: '✓', activeClass: 'bg-green-500/20 text-green-400 border-green-500/30', title: 'Approve' },
                                { value: 'PENDING',  label: '⏳', activeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', title: 'Set Pending' },
                                { value: 'REJECTED', label: '✕', activeClass: 'bg-red-500/20 text-red-400 border-red-500/30', title: 'Reject' },
                              ] as const
                            ).map(btn => (
                              <button
                                key={btn.value}
                                title={btn.title}
                                disabled={actionLoading === player.id}
                                onClick={() => player.status !== btn.value && handleStatusChange(player.id, btn.value)}
                                className={`px-2 py-0.5 rounded border text-xs font-medium transition-colors disabled:opacity-40 ${
                                  player.status === btn.value
                                    ? btn.activeClass + ' cursor-default'
                                    : 'border-transparent text-gray-600 hover:text-gray-300 hover:border-[#2A2A3A]'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        )}
                        <Link
                          href={`/admin/players/${player.id}`}
                          className="rounded px-2 py-1 text-xs border border-[#2A2A3A] hover:bg-[#2A2A3A] transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/players/${player.id}?tab=performance`}
                          className="rounded p-1.5 text-[#FFD700]/60 hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
                          title="Edit Stats"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteDialog({
                              playerId: player.id,
                              playerName: player.fullName,
                              deleting: false,
                            })
                          }
                          disabled={player.status === 'SOLD' || actionLoading === player.id}
                          className="rounded p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title={player.status === 'SOLD' ? 'Cannot delete a SOLD player' : 'Delete player'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {/* ── Delete Confirmation Dialog ── */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#0A0A0F] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Delete Player?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Hidden from all views — recoverable by admins</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              <span className="font-medium text-white">{deleteDialog.playerName}</span> will be removed
              from the auction pool and all player lists. Their data is kept and can be restored.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteDialog(null)}
                disabled={deleteDialog.deleting}
                className="flex-1 rounded-xl border border-[#2A2A3A] py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteDialog.deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteDialog.deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Player Slide-Over ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setShowAdd(false)} />
          <div className="w-full max-w-md h-full bg-[#0A0A0F] border-l border-[#2A2A3A] flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[#2A2A3A] px-5 py-4 shrink-0">
              <div>
                <h2 className="font-semibold text-white">Add Player</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create a player without self-registration</p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-[#2A2A3A] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable form */}
            <form onSubmit={submitAddPlayer} className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Personal Details */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase mb-3">
                  Personal Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input
                      required
                      value={addForm.fullName}
                      onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))}
                      className={inputCls}
                      placeholder="As registered on CricHeroes"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nickname</label>
                    <input
                      value={addForm.nickname}
                      onChange={e => setAddForm(f => ({ ...f, nickname: e.target.value }))}
                      className={inputCls}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Mobile Number *</label>
                      <input
                        value={addForm.mobileNumber}
                        onChange={e => setAddForm(f => ({ ...f, mobileNumber: e.target.value }))}
                        className={inputCls}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>WhatsApp Number</label>
                      <input
                        value={addForm.whatsappNumber}
                        onChange={e => setAddForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                        className={inputCls}
                        placeholder="If different"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Playing Profile */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase mb-3">
                  Playing Profile
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Primary Role *</label>
                    <select
                      required
                      value={addForm.primaryRole}
                      onChange={e => setAddForm(f => ({ ...f, primaryRole: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="BATTER">Batter</option>
                      <option value="BOWLER">Bowler</option>
                      <option value="ALL_ROUNDER">All Rounder</option>
                      <option value="WICKET_KEEPER">Wicket Keeper</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Batting Style *</label>
                      <select
                        required
                        value={addForm.battingStyle}
                        onChange={e => setAddForm(f => ({ ...f, battingStyle: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="Right Hand Bat">Right Hand Bat</option>
                        <option value="Left Hand Bat">Left Hand Bat</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Bowling Style *</label>
                      <select
                        required
                        value={addForm.bowlingStyle}
                        onChange={e => setAddForm(f => ({ ...f, bowlingStyle: e.target.value }))}
                        className={inputCls}
                      >
                        {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Preferred Batting Position</label>
                      <input
                        type="number" min={1} max={11}
                        value={addForm.preferredBattingPosition}
                        onChange={e => setAddForm(f => ({ ...f, preferredBattingPosition: e.target.value }))}
                        className={inputCls}
                        placeholder="1–11"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Preferred Bowling Phase</label>
                      <select
                        value={addForm.preferredBowlingPhase}
                        onChange={e => setAddForm(f => ({ ...f, preferredBowlingPhase: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="">— Any —</option>
                        <option value="Powerplay">Powerplay</option>
                        <option value="Middle Overs">Middle Overs</option>
                        <option value="Death Overs">Death Overs</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Strengths</label>
                    <textarea
                      rows={2}
                      value={addForm.strengths}
                      onChange={e => setAddForm(f => ({ ...f, strengths: e.target.value }))}
                      className={inputCls + ' resize-none'}
                      placeholder="e.g. Explosive opener, death-over bowler…"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Short Bio</label>
                    <textarea
                      rows={2}
                      value={addForm.bio}
                      onChange={e => setAddForm(f => ({ ...f, bio: e.target.value }))}
                      className={inputCls + ' resize-none'}
                      placeholder="Optional player background"
                    />
                  </div>
                </div>
              </div>

              {/* Auction Settings */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase mb-3">
                  Auction Settings
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Base Price (pts) *</label>
                      <input
                        type="number" min={5} max={100} required
                        value={addForm.basePrice}
                        onChange={e => setAddForm(f => ({ ...f, basePrice: parseInt(e.target.value) || 10 }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Auction Order</label>
                      <input
                        type="number" min={1}
                        value={addForm.auctionOrder}
                        onChange={e => setAddForm(f => ({ ...f, auctionOrder: e.target.value }))}
                        className={inputCls}
                        placeholder="Auto (append)"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select
                      value={addForm.status}
                      onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="APPROVED">APPROVED — enters auction pool immediately</option>
                      <option value="PENDING">PENDING — requires manual approval</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={addSaving}
                className="w-full rounded-xl bg-[#FFD700] py-3 font-bold text-black hover:bg-[#C9A227] disabled:opacity-50 transition-all"
              >
                {addSaving ? 'Adding…' : 'Add Player'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
