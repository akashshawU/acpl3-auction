// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#FFD700',
          muted: '#C9A227',
          dark: '#8B6914',
        },
        auction: {
          bg: '#0A0A0F',
          surface: '#111118',
          surface2: '#1A1A24',
          border: '#2A2A3A',
        },
      },
      fontFamily: {
        display: ['var(--font-rajdhani)', 'sans-serif'],
        ui: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'bid-flash': 'bidFlash 0.5s ease-in-out',
        'count-up': 'countUp 0.3s ease-out',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
        'slide-in': 'slideIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'sold-stamp': 'soldStamp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        bidFlash: {
          '0%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: '#FFD70033' },
          '100%': { backgroundColor: 'transparent' },
        },
        countUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        timerPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        soldStamp: {
          '0%': { transform: 'scale(3) rotate(-15deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(-15deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
