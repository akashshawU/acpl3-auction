// src/lib/rating-engine.ts
export interface PlayerStats {
  runs: number;
  wickets: number;
  strikeRate: number;
  economyRate: number;
  momAwards: number;
  matchesPlayed: number;
}

export interface ACPLRating {
  score: number;
  category: 'Elite' | 'A+' | 'A' | 'B+' | 'B' | 'C';
}

export function calculateACPLRating(stats: PlayerStats): ACPLRating {
  if (stats.matchesPlayed === 0) return { score: 0, category: 'C' };

  const runsComponent = stats.runs / 10;
  const wicketsComponent = stats.wickets * 5;
  const strikeRateComponent = stats.strikeRate / 10;
  const economyComponent = Math.max(0, (10 - stats.economyRate) * 3);
  const momComponent = stats.momAwards * 5;

  const raw = runsComponent + wicketsComponent + strikeRateComponent + economyComponent + momComponent;
  const score = Math.min(100, Math.round(raw));

  const category: ACPLRating['category'] =
    score >= 85 ? 'Elite' :
    score >= 75 ? 'A+' :
    score >= 60 ? 'A' :
    score >= 45 ? 'B+' :
    score >= 30 ? 'B' : 'C';

  return { score, category };
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Elite: '#FFD700',
    'A+': '#C0A060',
    A:    '#A0A0A0',
    'B+': '#CD7F32',
    B:    '#6B7280',
    C:    '#374151',
  };
  return map[category] ?? '#374151';
}

export function getCategoryBgClass(category: string): string {
  const map: Record<string, string> = {
    Elite: 'bg-yellow-400 text-black',
    'A+':  'bg-amber-600 text-white',
    A:     'bg-slate-400 text-black',
    'B+':  'bg-orange-700 text-white',
    B:     'bg-gray-500 text-white',
    C:     'bg-gray-700 text-white',
  };
  return map[category] ?? 'bg-gray-700 text-white';
}
