// src/components/auction/BidTimer.tsx
'use client';

import { cn } from '@/lib/utils';

interface Props {
  seconds: number;
  total: number;
  size?: number; // SVG size in px
  strokeWidth?: number;
}

export function BidTimer({ seconds, total, size = 120, strokeWidth = 8 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? seconds / total : 0;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = seconds <= 10 && seconds > 0;
  const center = size / 2;

  return (
    <div className={cn('relative inline-flex items-center justify-center', isUrgent && 'animate-[timerPulse_1s_ease-in-out_infinite]')}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#2A2A3A" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={isUrgent ? '#EF4444' : '#FFD700'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'font-display text-3xl font-bold',
            isUrgent ? 'text-red-400' : 'text-white'
          )}
        >
          {seconds}
        </span>
      </div>
    </div>
  );
}
