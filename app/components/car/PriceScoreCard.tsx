import { Calculator, CircleAlert, HandCoins, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { formatPrice } from '~/utils/helpers';
import type { PriceScore } from '~/utils/priceScore';

interface PriceScoreCardProps {
  score: PriceScore;
}

const levelStyles = {
  below_market: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  fair: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  above_market: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  insufficient: 'border-white/15 bg-white/5 text-gray-300',
};

export function PriceScoreCard({ score }: PriceScoreCardProps) {
  const direction = score.level === 'above_market' ? 'peste' : score.level === 'below_market' ? 'sub' : 'față de';

  return (
    <Card variant="elevated" padding="lg" className="bg-glass border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-accent-gold/15 p-2 text-accent-gold">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Price Score</h3>
            <p className="text-xs text-gray-400">Estimare din anunțuri similare publicate</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${levelStyles[score.level]}`}>
          {score.level === 'below_market' ? <TrendingDown className="mr-1 h-3.5 w-3.5" /> : score.level === 'above_market' ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <CircleAlert className="mr-1 h-3.5 w-3.5" />}
          {score.label}
        </span>
      </div>

      {score.available ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-400">Mediană comparabile ({score.comparableCount})</p>
            <p className="mt-1 text-xl font-bold text-white">{formatPrice(score.marketMedian || 0, score.currency)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-gray-400">Poziționare preț</p>
            <p className="mt-1 text-xl font-bold text-white">{Math.abs(score.differencePercent || 0).toFixed(1)}% {direction} mediană</p>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
          Price Score va apărea când există minimum 3 anunțuri comparabile pentru acest model. Acum sunt {score.comparableCount}.
        </p>
      )}

      <div className="mt-4 border-t border-white/10 pt-4">
        {score.recommendedOffer ? (
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <HandCoins className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-gold" />
            <span>Țintă de negociere: <strong className="text-white">{formatPrice(score.recommendedOffer, score.currency)}</strong>.</span>
          </div>
        ) : score.available ? (
          <p className="text-sm text-gray-300">Prețul este poziționat realist pentru comparabilele disponibile.</p>
        ) : null}
        <p className="mt-3 text-sm text-gray-300">
          Estimare rată: <strong className="text-white">{formatPrice(score.monthlyPayment, score.currency)}/lună</strong>
          <span className="text-gray-500"> · avans {score.assumptions.downPaymentPercent}% · {score.assumptions.termMonths} luni · dobândă {score.assumptions.annualInterestRate}%/an</span>
        </p>
      </div>
    </Card>
  );
}
