// src/app/not-found.tsx
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0A0A0F] px-4 text-center">
      <Logo />
      <div>
        <h1 className="text-6xl font-bold text-[#FFD700]">404</h1>
        <p className="mt-2 text-gray-400">Page not found</p>
      </div>
      <Link href="/" className="rounded-lg bg-[#FFD700] px-6 py-2.5 font-bold text-black hover:bg-[#C9A227] transition-all">
        Go Home
      </Link>
    </div>
  );
}
