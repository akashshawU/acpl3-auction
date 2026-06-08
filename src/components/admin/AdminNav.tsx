// src/components/admin/AdminNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Shield, Gavel, BarChart3, LogOut, Monitor
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/teams', label: 'Teams', icon: Shield },
  { href: '/admin/auction/setup', label: 'Auction Setup', icon: Gavel },
  { href: '/admin/auction/control', label: 'Live Control', icon: Monitor },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[#2A2A3A] bg-[#111118]">
      <div className="p-6">
        <Logo />
        <p className="mt-1 text-xs text-gray-500">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-[#FFD700]/10 text-[#FFD700]'
                      : 'text-gray-400 hover:bg-[#1A1A24] hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3">
        <Link
          href="/auction/live"
          target="_blank"
          className="mb-2 flex items-center justify-center gap-2 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/10 px-3 py-2 text-sm font-medium text-[#FFD700] hover:bg-[#FFD700]/20 transition-all"
        >
          <Monitor className="h-4 w-4" />
          Open Live Screen
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-[#1A1A24] hover:text-white transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
