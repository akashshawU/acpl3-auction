// src/app/(admin)/teams/page.tsx
export const dynamic = 'force-dynamic';
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { TeamWithPlayers } from '@/types';
import { PlayerCard } from '@/components/players/PlayerCard';
import { TeamBudgetBar } from '@/components/auction/TeamBudgetBar';
import { Plus, X } from 'lucide-react';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#3B82F6', purse: 100 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(d => {
      if (d.success) setTeams(d.data);
      setLoading(false);
    });
  }, []);

  async function createTeam() {
    setSaving(true);
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast.success('Team created');
      setShowCreate(false);
      const r2 = await fetch('/api/teams').then(r => r.json());
      if (r2.success) setTeams(r2.data);
    } else {
      toast.error(data.error ?? 'Failed');
    }
  }

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-[#FFD700] px-4 py-2.5 font-bold text-black hover:bg-[#C9A227] transition-all"
        >
          <Plus className="h-4 w-4" /> New Team
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#2A2A3A] bg-[#111118] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Create Team</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Team Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Team Color</label>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] cursor-pointer" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Purse (pts)</label>
                <input type="number" min={10} value={form.purse} onChange={e => setForm(f => ({ ...f, purse: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-[#2A2A3A] py-2.5 text-sm hover:bg-[#1A1A24] transition-all">Cancel</button>
              <button onClick={createTeam} disabled={saving || !form.name}
                className="flex-1 rounded-lg bg-[#FFD700] py-2.5 font-bold text-black hover:bg-[#C9A227] disabled:opacity-50 transition-all">
                {saving ? 'â€¦' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {teams.map(team => (
          <div key={team.id} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color ?? '#6B7280' }} />
              <h2 className="font-bold text-lg">{team.name}</h2>
              <span className="ml-auto text-sm text-gray-400">
                {team.players.filter(p => p.status === 'SOLD').length}/10
              </span>
            </div>
            <TeamBudgetBar team={team} />
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {team.players.filter(p => p.status === 'SOLD').map(p => (
                <PlayerCard key={p.id} player={p} compact />
              ))}
              {team.players.filter(p => p.status === 'SOLD').length === 0 && (
                <p className="text-center text-xs text-gray-500 py-4">No players yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}