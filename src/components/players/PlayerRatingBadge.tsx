// src/components/players/PlayerRatingBadge.tsx
import { cn } from '@/lib/utils';
import { getCategoryBgClass } from '@/lib/rating-engine';

interface Props {
  score: number | null;
  category: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerRatingBadge({ score, category, size = 'md' }: Props) {
  if (!score || !category) return null;

  const bgClass = getCategoryBgClass(category);
  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md font-bold', bgClass, sizes[size])}>
      {category === 'Elite' ? (
        <span className="elite-shimmer">{category}</span>
      ) : (
        category
      )}
      <span className="opacity-80">· {score}</span>
    </span>
  );
}
