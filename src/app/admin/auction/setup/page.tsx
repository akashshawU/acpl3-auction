// src/app/(admin)/auction/setup/page.tsx
export const dynamic = 'force-dynamic';
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Player } from '@/types';
import { PlayerRatingBadge } from '@/components/players/PlayerRatingBadge';
import { roleLabel, roleColor } from '@/lib/utils';
import { GripVertical, Rocket } from 'lucide-react';
import Link from 'next/link';

const INCREMENTS = [1, 2, 5, 10];

export default function AuctionSetupPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ timerSeconds: 30, bidIncrement: 1, name: 'ACPL 3 Player Auction' });

  useEffect(() => {
    Promise.all([
      fetch('/api/players?status=APPROVED').then(r => r.json()),
      fetch('/api/auction/session').then(r => r.json()),
    ]).then(([pData, sData]) => {
      if (pData.success) setPlayers(pData.data.sort((a: Player, b: Player) => (a.auctionOrder ?? 999) - (b.auctionOrder ?? 999)));
      if (sData.success && sData.data?.session) {
        const s = sData.data.session;
        setConfig({ timerSeconds: s.timerSeconds, bidIncrement: s.bidIncrement, name: s.name });
      }
      setLoading(false);
    });
  }, []);

  async function saveConfig() {
    setSaving(true);
    // Save session config
    await fetch('/api/auction/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    // Save player order
    await Promise.all(
      players.map((p, i) =>
        fetch(`/api/players/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auctionOrder: i + 1 }),
        })
      )
    );
    setSaving(false);
    toast.success('Auction configured!');
  }

  async function launchAuction() {
    await saveConfig();
    const res = await fetch('/api/auction/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'START', sessionId: 'default-session' }),
    });
    const data = await res.json();
    if (data.success) toast.success('Auction launched! Go to Live Control.');
    else toast.error(data.error ?? 'Failed to launch');
  }

  // Drag reorder
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
      <div>
        <h1 className="text-2xl font-bold">Auction Setup</h1>
        <p className="text-sm text-gray-400">Configure timer, increments, and player order</p>
      </div>

      {/* Config */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-5 space-y-4">
        <h2 className="font-semibold text-[#FFD700]">Session Configuration</h2>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Auction Name</label>
          <input value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
            className="w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2 text-sm outline-none focus:border-[#FFD700] transition-colors" />
        </div>
        <div>
          <label className="mb-2 block text-xs text-gray-400">Timer Duration (seconds)</label>
          <input
            type="range" min={10} max={60} step={5} value={config.timerSeconds}
            onChange={e => setConfig(c => ({ ...c, timerSeconds: Number(e.target.value) }))}
            className="w-full accent-yellow-400"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10s</span><span className="font-bold text-[#FFD700]">{config.timerSeconds}s</span><span>60s</span>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs text-gray-400">Bid Increment</label>
          <div className="flex gap-2">
            {INCREMENTS.map(n => (
              <button
                key={n} onClick={() => setConfig(c => ({ ...c, bidIncrement: n }))}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${config.bidIncrement === n ? 'bg-[#FFD700] text-black' : 'border border-[#2A2A3A] text-gray-300 hover:border-[#3A3A4A]'}`}
              >
                {n} Point{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Player Order */}
      <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#FFD700]">Auction Order</h2>
          <span className="text-xs text-gray-400">{players.length} players Â· drag to reorder</span>
        </div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {players.map((p, i) => {
            const roleClr = roleColor(p.primaryRole);
            return (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragging(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragEnd={() => setDragging(null)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-grab transition-all ${dragging === i ? 'border-[#FFD700]/50 bg-[#FFD700]/10' : 'border-[#2A2A3A] bg-[#1A1A24] hover:border-[#3A3A4A]'}`}
              >
                <GripVertical className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="w-6 text-xs font-mono text-gray-500">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{p.fullName}</span>
                </div>
                <span className="text-xs" style={{ color: roleClr }}>{roleLabel(p.primaryRole)}</span>
                <PlayerRatingBadge score={p.acplRating} category={p.acplCategory} size="sm" />
                <span className="font-mono text-xs text-[#FFD700]">{p.basePrice}pt</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveConfig} disabled={saving}
          className="flex-1 rounded-xl border border-[#FFD700]/40 py-3 font-medium text-[#FFD700] hover:bg-[#FFD700]/10 disabled:opacity-50 transition-all"
        >
          {saving ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Save Configuration'}
        </button>
        <button
          onClick={launchAuction} disabled={saving || players.length === 0}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FFD700] py-3 font-bold text-black hover:bg-[#C9A227] disabled:opacity-50 transition-all"
        >
          <Rocket className="h-5 w-5" /> Launch Auction
        </button>
      </div>

      <Link href="/admin/auction/control" className="block text-center text-sm text-[#FFD700] hover:underline">
        Go to Live Control â†’
      </Link>
    </div>
  );
}