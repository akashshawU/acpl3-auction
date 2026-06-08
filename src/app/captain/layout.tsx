// src/app/(captain)/layout.tsx
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default async function CaptainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <header className="border-b border-[#2A2A3A] bg-[#111118] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session?.user?.name}</span>
            <Link href="/captain/squad" className="text-sm text-[#FFD700] hover:underline">Squad</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
