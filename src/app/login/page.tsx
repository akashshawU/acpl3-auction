'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
      router.push('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl font-black tracking-tight text-[#FFD700]">ACPL 3</div>
          <p className="text-sm text-gray-400">Cricket Player Auction</p>
        </div>

        <div className="rounded-2xl border border-[#2A2A3A] bg-[#111118] p-8">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FFD700] transition-colors"
                placeholder="admin@acpl3.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2A2A3A] bg-[#1A1A24] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FFD700] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#FFD700] py-2.5 font-bold text-black hover:bg-[#C9A227] disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
