import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect('/login');

  if (session.user.role === 'SUPER_ADMIN') redirect('/admin/dashboard');
  if (session.user.role === 'CAPTAIN') redirect('/captain/dashboard');
  redirect('/login');
}
