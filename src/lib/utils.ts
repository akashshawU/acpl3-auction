// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(value: number): string {
  return `${value} pt${value !== 1 ? 's' : ''}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    BATTER: 'Batter',
    BOWLER: 'Bowler',
    ALL_ROUNDER: 'All-Rounder',
    WICKET_KEEPER: 'Wicket Keeper',
  };
  return map[role] ?? role;
}

export function roleColor(role: string): string {
  const map: Record<string, string> = {
    BATTER: '#3B82F6',
    BOWLER: '#EF4444',
    ALL_ROUNDER: '#8B5CF6',
    WICKET_KEEPER: '#F59E0B',
  };
  return map[role] ?? '#6B7280';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    APPROVED: 'text-blue-400 bg-blue-400/10',
    SOLD: 'text-green-400 bg-green-400/10',
    UNSOLD: 'text-gray-400 bg-gray-400/10',
    REJECTED: 'text-red-400 bg-red-400/10',
  };
  return map[status] ?? 'text-gray-400 bg-gray-400/10';
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
