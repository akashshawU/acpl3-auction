// src/components/shared/Logo.tsx
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: Props) {
  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center justify-center rounded-lg bg-[#FFD700] p-1.5">
        <svg viewBox="0 0 24 24" className={cn('text-black', size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-9 w-9')} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-10h2v8h-2z"/>
        </svg>
      </div>
      <span className={cn('font-display font-bold tracking-wider', textSizes[size])}>
        <span className="text-[#FFD700]">ACPL</span>
        <span className="text-white"> 3</span>
      </span>
    </div>
  );
}
