import type { Metadata } from 'next';
import { Rajdhani, Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-rajdhani' });

export const metadata: Metadata = {
  title: 'ACPL 3 — Cricket Player Auction',
  description: 'Live player auction management system for ACPL Season 3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${rajdhani.variable}`}>
      <body className={inter.className}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            style: { background: '#111118', border: '1px solid #2A2A3A', color: '#F8FAFC' },
          }}
        />
      </body>
    </html>
  );
}
