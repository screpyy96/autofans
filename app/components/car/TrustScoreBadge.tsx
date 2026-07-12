import { ShieldCheck } from 'lucide-react';
import { cn } from '~/lib/utils';

interface TrustScoreBadgeProps {
  score?: number;
  level?: 'verified' | 'good' | 'basic';
  compact?: boolean;
}

export function TrustScoreBadge({ score = 0, level = 'basic', compact = false }: TrustScoreBadgeProps) {
  const styles = {
    verified: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    good: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    basic: 'border-white/15 bg-white/5 text-gray-300',
  }[level];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold', styles)} title={`Trust Score: ${score}/100`}>
      <ShieldCheck className="h-3.5 w-3.5" />
      {!compact && <span>{score}/100</span>}
    </span>
  );
}
