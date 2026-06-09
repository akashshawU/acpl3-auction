'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { TeamWithPlayers } from '@/types';
import { Pencil } from 'lucide-react';

export function TeamStatusGrid() {
  const [teams, setTeams]           = useState<TeamWithPlayers[]>([]);
  const [editingPurse, setEditingPurse] = useState<string | null>(null);
  const [purseValue, setPurseValue] = useState(0);
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/teams').then(r => r.json());
    if (r.success) setTeams(r.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function savePurse(teamId: string) {
    setSaving(true);
    try {
      const res  = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purse: purseValue }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Save failed');
      toast.success('Total purse updated');
      setEditingPurse(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (teams.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {teams.map(t => (
        <div key={t.id} className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-4 space-y-2">
          {/* Team name + color dot */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: t.color ?? '#6B7280' }} />
            <span className="text-sm font-semibold truncate">{t.name}</span>
          </div>

          {/* Remaining purse */}
          <div className="text-xs text-gray-400">
            {t.players.filter(p => p.status === 'SOLD').length} players &middot; {t.remainingPurse} pts left
          </div>

          {/* Total purse with quick-edit */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-gray-500">Total Purse</span>
            {editingPurse === t.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={purseValue}
                  onChange={e => setPurseValue(parseInt(e.target.value) || 0)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') savePurse(t.id);
                    if (e.key === 'Escape') setEditingPurse(null);
                  }}
                  autoFocus
                  min={10}
                  max={500}
                  className="w-14 bg-[#0A0A0F] border border-[#FFD700]/40 rounded px-1.5 py-0.5 text-white text-xs focus:outline-none"
                />
                <span className="text-xs text-gray-500">pts</span>
                <button
                  onClick={() => savePurse(t.id)}
                  disabled={saving}
                  className="text-xs text-[#FFD700] px-1 hover:text-white transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingPurse(null)}
                  className="text-xs text-gray-600 px-1 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingPurse(t.id); setPurseValue(t.purse); }}
                className="flex items-center gap-1 group"
                title="Edit total purse"
              >
                <span className="text-sm font-semibold text-white">{t.purse} pts</span>
                <Pencil className="h-3 w-3 text-gray-600 group-hover:text-[#FFD700] transition-colors" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-[#2A2A3A]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${t.purse > 0 ? (t.remainingPurse / t.purse) * 100 : 0}%`,
                backgroundColor: t.color ?? '#FFD700',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
