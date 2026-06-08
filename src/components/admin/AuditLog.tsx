// src/components/admin/AuditLog.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import type { AuditLog } from '@/types';

interface AuditLogWithUser extends AuditLog {
  user?: { name: string } | null;
  player?: { fullName: string } | null;
}

interface Props {
  logs: AuditLogWithUser[];
}

const ACTION_ICONS: Record<string, string> = {
  PLAYER_REGISTERED: '📝',
  PLAYER_APPROVED: '✅',
  PLAYER_REJECTED: '❌',
  PLAYER_EDITED: '✏️',
  AUCTION_STARTED: '🎉',
  AUCTION_PAUSED: '⏸️',
  AUCTION_RESUMED: '▶️',
  BID_PLACED: '💰',
  BID_UNDONE: '↩️',
  PLAYER_SOLD: '🏆',
  PLAYER_UNSOLD: '📭',
  PLAYER_REINTRODUCED: '🔄',
  AUCTION_ENDED: '🏁',
  RATING_OVERRIDDEN: '⭐',
  BASE_PRICE_SET: '💵',
};

export function AuditLogTable({ logs }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2A2A3A] text-left">
            <th className="pb-2 pr-4 text-xs font-medium text-gray-400">Action</th>
            <th className="pb-2 pr-4 text-xs font-medium text-gray-400">User</th>
            <th className="pb-2 pr-4 text-xs font-medium text-gray-400">Player</th>
            <th className="pb-2 text-xs font-medium text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b border-[#2A2A3A]/50 hover:bg-[#1A1A24] transition-colors">
              <td className="py-2 pr-4">
                <span className="flex items-center gap-2">
                  <span>{ACTION_ICONS[log.action] ?? '•'}</span>
                  <span className="font-mono text-xs text-gray-300">{log.action}</span>
                </span>
              </td>
              <td className="py-2 pr-4 text-gray-400">{log.user?.name ?? '—'}</td>
              <td className="py-2 pr-4 text-gray-400">{log.player?.fullName ?? '—'}</td>
              <td className="py-2 text-xs text-gray-500">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
