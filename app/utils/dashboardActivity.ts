export type ActivityWindow = {
  current: number;
  previous: number;
};

/**
 * A compact, neutral explanation of recent seller activity. We deliberately
 * avoid inventing a percentage when the previous period had no events.
 */
export function formatActivityWindow({ current, previous }: ActivityWindow): string {
  if (current === 0 && previous === 0) return 'fără activitate în ultimele 7 zile';
  if (previous === 0) return `${current} în ultimele 7 zile`;

  const percent = Math.round(((current - previous) / previous) * 100);
  const direction = percent > 0 ? `+${percent}%` : `${percent}%`;
  return `${current} în ultimele 7 zile · ${direction} vs. săpt. trecută`;
}
