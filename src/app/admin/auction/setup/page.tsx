'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Player } from '@/types';
import { roleLabel, roleColor } from '@/lib/utils';
import { GripVertical, ListOrdered, Gamepad2, Trophy, History, RotateCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const INCREMENTS = [1, 2, 5, 10];

export default function AuctionSetupPage() {
  const router = useRouter();
  const [players, setPlayers]       = useState<Player[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [config, setConfig]         = useState({ timerSeconds: 30, bidIncrement: 1, name: 'ACPL 3 Player Auction' });
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  // Live auction confirmation dialog state
  const [liveConfirmDialog, setLiveConfirmDialog] = useState(false);

  // Nuclear reset dialog state
  const [resetDialog, setResetDialog] = useState(false);
  const [resetting, setResetting]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/players?status=APPROVED').then(r => r.json()),
      fetch('/api/auction/session').then(r => r.json()),
    ]).then(([pData, sData]) => {
      if (pData.success) {
        setPlayers(pData.data.sort((a: Player, b: Player) => (a.auctionOrder ?? 999) - (b.auctionOrder ?? 999)));
      }
      if (sData.success && sData.data?.session) {
        const s = sData.data.session;
        setConfig({ timerSeconds: s.timerSeconds, bidIncrement: s.bidIncrement, name: s.name });
        setSessionStatus(s.status ?? null);
      }
      setLoading(false);
    });
  }, []);

  // Saves only player order — no session creation
  async function saveConfig() {
    setSaving(true);
    await Promise.all(
      players.map((p, i) =>
        fetch(`/api/players/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auctionOrder: i + 1 }),
        }),
      ),
    );
    setSaving(false);
    toast.success('Player order saved!');
  }

  // Creates a new session and redirects to Live Control
  async function createSession({ type, resetAssignments = false }: { type: 'DEMO' | 'LIVE'; resetAssignments?: boolean }) {
    setSaving(true);
    // Save player order first
    await Promise.all(
      players.map((p, i) =>
        fetch(`/api/players/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auctionOrder: i + 1 }),
        }),
      ),
    );
    const res  = await fetch('/api/admin/auction/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, type, resetAssignments }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      toast.success(`${type === 'DEMO' ? '🎮 Demo' : '🏆 Live'} auction started!`);
      router.push('/admin/auction/control');
    } else {
      toast.error(typeof data.error === 'string' ? data.error : 'Failed to create session');
    }
  }

  function sortByMVPRank() {
    setPlayers(prev =>
      [...prev].sort((a, b) => {
        const aR = a.performance?.rankInMVPLeaderboard ?? 0;
        const bR = b.performance?.rankInMVPLeaderboard ?? 0;
        const aEff = aR === 0 ? 0 : aR;
        const bEff = bR === 0 ? 0 : bR;
        return bEff - aEff;
      }),
    );
    toast.success('Players sorted by MVP Rank (descending — rank #1 goes last). Save to confirm.');
  }

  async function resetEverything() {
    setResetting(true);
    try {
      const res  = await fetch('/api/admin/auction/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuclear: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Everything reset — all players are PENDING, budgets restored.');
        setResetDialog(false);
        // Re-fetch approved players (list will now be empty until re-approved)
        const pData = await fetch('/api/players?status=APPROVED').then(r => r.json());
        if (pData.success) {
          setPlayers(pData.data.sort((a: Player, b: Player) => (a.auctionOrder ?? 999) - (b.auctionOrder ?? 999)));
        } else {
          setPlayers([]);
        }
      } else {
        toast.error(typeof data.error === 'string' ? data.error : 'Reset failed');
      }
    } finally {
      setResetting(false);
    }
  }

  const [dragging, setDragging] = useState<number | null>(null);

  function handleDragOver(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    if (dragging === null || dragging === targetIdx) return;
    setPlayers(prev => {
      const arr = [...prev];
      const [removed] = arr.splice(dragging, 1);
      arr.splice(targetIdx, 0, removed);
      return arr;
    });
    setDragging(targetIdx);
  }

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auction Setup</h1>
          <p className="text-sm text-gray-400">Configure timer, increments, and player order</p>
        </div>
        <Link
          href="/admin/auction/history"
          className="flex items-center gap-1.5 rounded-lg border border-[#2A2A3A] px-3 py-2 text-xs text-gray-400 hover:text-white hover:border-[#3A3A4A] transition-colors"
        >
          <History className="h-3.5 w-3.5" /> History
        </Link>
      </div>

      {/* Session config */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-5 space-y-4">
        <h2 className="font-semibold text-[#FFD700]">Session Configuration</h2>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Auction Name</label>
          <input
            value={config.name}
            onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
            className="w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs text-gray-400">Timer Duration (seconds)</label>
          <input
            type="range" min={10} max={60} step={5} value={config.timerSeconds}
            onChange={e => setConfig(c => ({ ...c, timerSeconds: Number(e.target.value) }))}
            className="w-full accent-yellow-400"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10s</span>
            <span className="font-bold text-[#FFD700]">{config.timerSeconds}s</span>
            <span>60s</span>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs text-gray-400">Bid Increment</label>
          <div className="flex gap-2">
            {INCREMENTS.map(n => (
              <button
                key={n}
                onClick={() => setConfig(c => ({ ...c, bidIncrement: n }))}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  config.bidIncrement === n
                    ? 'bg-[#FFD700] text-black'
                    : 'border border-[#2A2A3A] text-gray-300 hover:border-[#3A3A4A]'
                }`}
              >
                {n} Point{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Player order */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-semibold text-[#FFD700]">Auction Order</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{players.length} players · drag to reorder</span>
            <button
              onClick={sortByMVPRank}
              className="flex items-center gap-1.5 rounded-lg border border-[#FFD700]/40 px-3 py-1.5 text-xs font-medium text-[#FFD700] hover:bg-[#FFD700]/10 transition-all"
            >
              <ListOrdered className="h-3 w-3" />
              Sort by MVP Rank
            </button>
          </div>
        </div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {players.map((p, i) => {
            const roleClr = roleColor(p.primaryRole);
            const mvpRank = p.performance?.rankInMVPLeaderboard;
            return (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragging(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragEnd={() => setDragging(null)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-grab transition-all ${
                  dragging === i
                    ? 'border-[#FFD700]/50 bg-[#FFD700]/10'
                    : 'border-[#2A2A3A] bg-[#1A1A24] hover:border-[#3A3A4A]'
                }`}
              >
                <GripVertical className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="w-6 text-xs font-mono text-gray-500">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{p.fullName}</span>
                </div>
                <span className="text-xs" style={{ color: roleClr }}>{roleLabel(p.primaryRole)}</span>
                {mvpRank && mvpRank > 0 ? (
                  <span className="rounded px-1.5 py-0.5 text-xs font-mono text-gray-300 bg-[#2A2A3A]">
                    MVP #{mvpRank}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">—</span>
                )}
                <span className="font-mono text-xs text-[#FFD700]">{p.basePrice}pt</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={saveConfig}
        disabled={saving}
        className="w-full rounded-xl border border-[#FFD700]/40 py-3 font-medium text-[#FFD700] hover:bg-[#FFD700]/10 disabled:opacity-50 transition-all"
      >
        {saving ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Save Player Order'}
      </button>

      {/* Demo / Live launch choice */}
      <div className="space-y-3">
        <button
          onClick={() => createSession({ type: 'DEMO' })}
          disabled={saving || players.length === 0}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-[#2A2A3A] bg-[#111118] hover:border-yellow-500/40 disabled:opacity-50 transition-colors group"
        >
          <div className="text-left">
            <p className="flex items-center gap-2 font-semibold text-white group-hover:text-yellow-400 transition-colors">
              <Gamepad2 className="h-4 w-4" /> Start Demo Auction
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Practice run — player assignments are temporary, will not affect actual squads
            </p>
          </div>
          <span className="text-gray-600 group-hover:text-yellow-400 transition-colors">→</span>
        </button>

        <button
          onClick={() => setLiveConfirmDialog(true)}
          disabled={saving || players.length === 0}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-[#FFD700]/40 bg-[#FFD700]/5 hover:bg-[#FFD700]/10 disabled:opacity-50 transition-colors group"
        >
          <div className="text-left">
            <p className="flex items-center gap-2 font-semibold text-[#FFD700]">
              <Trophy className="h-4 w-4" /> Start Live Auction
            </p>
            <p className="text-xs text-[#FFD700]/50 mt-0.5">
              Official auction — results are permanent, squads and budgets updated in real-time
            </p>
          </div>
          <span className="text-[#FFD700]/60 group-hover:text-[#FFD700] transition-colors">→</span>
        </button>
      </div>

      <Link href="/admin/auction/control" className="block text-center text-sm text-[#FFD700] hover:underline">
        Go to Live Control →
      </Link>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="font-semibold text-red-400 text-sm">Danger Zone</h2>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Reset Everything</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Moves all players back to Pending, clears all squad assignments, and restores every team's full budget.
              {(sessionStatus === 'LIVE' || sessionStatus === 'PAUSED') && (
                <span className="ml-1 text-yellow-400">Disabled during a live auction.</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setResetDialog(true)}
            disabled={sessionStatus === 'LIVE' || sessionStatus === 'PAUSED'}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Everything
          </button>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      {resetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !resetting && setResetDialog(false)} />
          <div className="relative bg-[#111118] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Reset Everything?</h3>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                  This will:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-300">
                  <li>• Move <strong className="text-white">all players</strong> back to <span className="font-mono text-yellow-400">PENDING</span></li>
                  <li>• Clear <strong className="text-white">all squad assignments</strong></li>
                  <li>• Restore <strong className="text-white">all team budgets</strong> to full</li>
                </ul>
                <p className="mt-3 text-xs text-red-400 font-medium">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setResetDialog(false)}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl border border-[#2A2A3A] text-gray-300 text-sm hover:bg-[#1A1A24] disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={resetEverything}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {resetting ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Yes, Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live auction confirmation dialog */}
      {liveConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setLiveConfirmDialog(false)} />
          <div className="relative bg-[#111118] border border-[#FFD700]/30 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#FFD700] flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Start Live Auction
              </h3>
              <p className="text-sm text-gray-300 mt-1">This is the real thing. Choose how to start:</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { createSession({ type: 'LIVE', resetAssignments: false }); setLiveConfirmDialog(false); }}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#FFD700] text-black font-bold text-sm hover:bg-[#C9A227] disabled:opacity-50 transition-all"
              >
                Continue from last state
                <span className="block text-xs font-normal opacity-70 mt-0.5">Keep existing sold players and budgets</span>
              </button>
              <button
                onClick={() => { createSession({ type: 'LIVE', resetAssignments: true }); setLiveConfirmDialog(false); }}
                disabled={saving}
                className="w-full py-3.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-50 transition-all"
              >
                Fresh start
                <span className="block text-xs font-normal opacity-70 mt-0.5">Reset all players and team budgets</span>
              </button>
              <button
                onClick={() => setLiveConfirmDialog(false)}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
