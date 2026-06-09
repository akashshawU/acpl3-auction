// src/app/(admin)/teams/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { TeamWithPlayers, User } from '@/types';
import { PlayerCard } from '@/components/players/PlayerCard';
import { TeamBudgetBar } from '@/components/auction/TeamBudgetBar';
import { Plus, X, Pencil, UserCircle2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamEdit {
  id: string;
  name: string;
  logoUrl: string;
  color: string;
  purse: number;
}

interface CaptainForm {
  name: string;
  email: string;
  newPassword: string;
  showPass: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTeamsPage() {
  const [teams, setTeams]       = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', color: '#3B82F6', purse: 100 });
  const [createSaving, setCreateSaving] = useState(false);

  // Inline team edit
  const [editTeam, setEditTeam]   = useState<TeamEdit | null>(null);
  const [teamSaving, setTeamSaving] = useState(false);

  // Inline captain edit — keyed by captain User.id
  const [editCaptainId, setEditCaptainId] = useState<string | null>(null);
  const [captainForm, setCaptainForm]     = useState<CaptainForm>({ name: '', email: '', newPassword: '', showPass: false });
  const [captainSaving, setCaptainSaving] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadTeams = useCallback(async () => {
    const r = await fetch('/api/teams').then(r => r.json());
    if (r.success) setTeams(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // ── Create team ─────────────────────────────────────────────────────────────

  async function createTeam() {
    setCreateSaving(true);
    const res  = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreateSaving(false);
    if (data.success) {
      toast.success('Team created');
      setShowCreate(false);
      setCreateForm({ name: '', color: '#3B82F6', purse: 100 });
      loadTeams();
    } else {
      toast.error(data.error ?? 'Failed to create team');
    }
  }

  // ── Team inline edit ────────────────────────────────────────────────────────

  function openTeamEdit(team: TeamWithPlayers) {
    setEditTeam({
      id:      team.id,
      name:    team.name,
      logoUrl: team.logoUrl ?? '',
      color:   team.color ?? '#3B82F6',
      purse:   team.purse,
    });
    // Close any open captain edit
    setEditCaptainId(null);
  }

  async function saveTeamEdit() {
    if (!editTeam) return;
    setTeamSaving(true);
    try {
      const res  = await fetch(`/api/admin/teams/${editTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    editTeam.name,
          color:   editTeam.color,
          purse:   editTeam.purse,
          logoUrl: editTeam.logoUrl || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Save failed');
      toast.success('Team updated');
      setEditTeam(null);
      loadTeams();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed');
    } finally {
      setTeamSaving(false);
    }
  }

  // ── Captain inline edit ──────────────────────────────────────────────────────

  function openCaptainEdit(captain: User) {
    setEditCaptainId(captain.id);
    setCaptainForm({ name: captain.name, email: captain.email, newPassword: '', showPass: false });
    // Close any open team edit
    setEditTeam(null);
  }

  async function saveCaptainEdit() {
    if (!editCaptainId) return;
    setCaptainSaving(true);
    try {
      const res  = await fetch(`/api/admin/captains/${editCaptainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:  captainForm.name,
          email: captainForm.email,
          ...(captainForm.newPassword.trim() ? { password: captainForm.newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Save failed');
      toast.success('Captain updated');
      if (captainForm.newPassword.trim()) toast.info(`New password set for ${captainForm.name}`);
      setEditCaptainId(null);
      loadTeams();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed');
    } finally {
      setCaptainSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FFD700] px-4 py-2.5 font-bold text-black hover:bg-[#C9A227] transition-all"
        >
          <Plus className="h-4 w-4" /> New Team
        </button>
      </div>

      {/* ── Create team modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#2A2A3A] bg-[#111118] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Create Team</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Team Name</label>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Team Color</label>
                <input
                  type="color"
                  value={createForm.color}
                  onChange={e => setCreateForm(f => ({ ...f, color: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] cursor-pointer"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Purse (pts)</label>
                <input
                  type="number"
                  min={10}
                  value={createForm.purse}
                  onChange={e => setCreateForm(f => ({ ...f, purse: Number(e.target.value) }))}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border border-[#2A2A3A] py-2.5 text-sm hover:bg-[#1A1A24] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                disabled={createSaving || !createForm.name}
                className="flex-1 rounded-lg bg-[#FFD700] py-2.5 font-bold text-black hover:bg-[#C9A227] disabled:opacity-50 transition-all"
              >
                {createSaving ? '…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Team grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {teams.map(team => {
          const captain         = team.users?.[0] ?? null;
          const isEditingTeam   = editTeam?.id === team.id;
          const isEditingCaptain = captain && editCaptainId === captain.id;
          const soldPlayers     = team.players.filter(p => p.status === 'SOLD');

          return (
            <div key={team.id} className="rounded-xl border border-[#2A2A3A] bg-[#111118] overflow-hidden">

              {/* ── Team header / edit form ─────────────────────────── */}
              {isEditingTeam ? (
                <div className="p-4 space-y-4 bg-[#0A0A0F] border-b border-[#FFD700]/20">
                  <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">Edit Team</p>

                  {/* Logo URL */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Logo URL</label>
                    <div className="flex items-center gap-3">
                      {editTeam.logoUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={editTeam.logoUrl}
                          alt="preview"
                          className="h-10 w-10 rounded-lg object-cover bg-[#1A1A24] border border-[#2A2A3A] shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <input
                        value={editTeam.logoUrl}
                        onChange={e => setEditTeam(t => t ? { ...t, logoUrl: e.target.value } : t)}
                        placeholder="https://… paste image URL"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Team Name</label>
                    <input
                      value={editTeam.name}
                      onChange={e => setEditTeam(t => t ? { ...t, name: e.target.value } : t)}
                      maxLength={50}
                      className={inputCls}
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Team Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={editTeam.color}
                        onChange={e => setEditTeam(t => t ? { ...t, color: e.target.value } : t)}
                        className="w-10 h-10 rounded-lg border border-[#2A2A3A] bg-transparent cursor-pointer"
                      />
                      <span className="text-sm text-gray-400 font-mono">{editTeam.color}</span>
                    </div>
                  </div>

                  {/* Purse */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Total Purse (pts)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editTeam.purse}
                        onChange={e => setEditTeam(t => t ? { ...t, purse: parseInt(e.target.value) || 0 } : t)}
                        min={10}
                        max={500}
                        className="w-32 bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]/50"
                      />
                      <span className="text-sm text-gray-500">pts</span>
                    </div>
                    {team.remainingPurse < team.purse && (
                      <p className="text-xs text-yellow-500/70 mt-1">
                        ⚠ Purse already in use — changing total will not retroactively adjust remaining purse.
                        Use "Reset Everything" before a new auction to restore it.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveTeamEdit}
                      disabled={teamSaving || !editTeam.name.trim()}
                      className="px-4 py-2 rounded-xl bg-[#FFD700] text-black text-sm font-bold hover:bg-[#C9A227] disabled:opacity-50 transition-colors"
                    >
                      {teamSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditTeam(null)}
                      className="px-4 py-2 rounded-xl bg-[#1A1A24] text-gray-300 text-sm hover:bg-[#2A2A3A] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal team header */
                <div className="p-4 flex items-center gap-3">
                  {team.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="h-8 w-8 rounded-lg object-cover shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: team.color ?? '#6B7280' }} />
                  )}
                  <h2 className="font-bold text-lg flex-1 min-w-0 truncate">{team.name}</h2>
                  <span className="text-sm text-gray-400 shrink-0">{soldPlayers.length}/10</span>
                  <button
                    onClick={() => openTeamEdit(team)}
                    className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
                    title="Edit team"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* ── Budget bar + captain + players ──────────────────── */}
              <div className="px-4 pb-4 space-y-3">
                <TeamBudgetBar team={team} />

                {/* Captain section */}
                {captain ? (
                  <div className="rounded-lg border border-[#2A2A3A] bg-[#0A0A0F] p-3">
                    {isEditingCaptain ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Edit Captain</p>

                        {/* Name */}
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Full Name</label>
                          <input
                            value={captainForm.name}
                            onChange={e => setCaptainForm(f => ({ ...f, name: e.target.value }))}
                            className={inputCls}
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Email (login username)</label>
                          <input
                            type="email"
                            value={captainForm.email}
                            onChange={e => setCaptainForm(f => ({ ...f, email: e.target.value }))}
                            className={inputCls}
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">New Password (leave blank to keep current)</label>
                          <div className="relative">
                            <input
                              type={captainForm.showPass ? 'text' : 'password'}
                              value={captainForm.newPassword}
                              onChange={e => setCaptainForm(f => ({ ...f, newPassword: e.target.value }))}
                              placeholder="Enter new password…"
                              className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50"
                            />
                            <button
                              type="button"
                              onClick={() => setCaptainForm(f => ({ ...f, showPass: !f.showPass }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
                            >
                              {captainForm.showPass ? '🙈' : '👁'}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={saveCaptainEdit}
                            disabled={captainSaving || !captainForm.name.trim() || !captainForm.email.trim()}
                            className="px-4 py-2 rounded-xl bg-[#FFD700] text-black text-sm font-bold hover:bg-[#C9A227] disabled:opacity-50 transition-colors"
                          >
                            {captainSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditCaptainId(null)}
                            className="px-4 py-2 rounded-xl bg-[#1A1A24] text-gray-300 text-sm hover:bg-[#2A2A3A] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Captain display row */
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserCircle2 className="h-4 w-4 text-gray-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white leading-tight">{captain.name}</p>
                            <p className="text-xs text-gray-500 truncate">{captain.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openCaptainEdit(captain)}
                          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2A2A3A] text-xs text-gray-400 hover:text-white hover:border-[#FFD700]/30 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Edit Captain
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 text-center py-1">No captain assigned</p>
                )}

                {/* Player list */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {soldPlayers.map(p => (
                    <PlayerCard key={p.id} player={p} compact />
                  ))}
                  {soldPlayers.length === 0 && (
                    <p className="text-center text-xs text-gray-500 py-3">No players yet</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
