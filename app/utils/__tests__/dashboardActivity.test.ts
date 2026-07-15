import { describe, expect, it } from 'vitest';
import { formatActivityWindow } from '../dashboardActivity';

describe('formatActivityWindow', () => {
  it('does not present empty activity as a fabricated trend', () => {
    expect(formatActivityWindow({ current: 0, previous: 0 })).toBe('fără activitate în ultimele 7 zile');
  });

  it('describes the first observed period without an infinite percentage', () => {
    expect(formatActivityWindow({ current: 4, previous: 0 })).toBe('4 în ultimele 7 zile');
  });

  it('compares the current seven-day window to the previous one', () => {
    expect(formatActivityWindow({ current: 15, previous: 10 })).toBe('15 în ultimele 7 zile · +50% vs. săpt. trecută');
    expect(formatActivityWindow({ current: 5, previous: 10 })).toBe('5 în ultimele 7 zile · -50% vs. săpt. trecută');
  });
});
