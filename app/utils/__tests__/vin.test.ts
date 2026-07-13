import { describe, expect, it } from 'vitest';
import { isValidVin, normalizeVin } from '~/utils/vin';

describe('VIN helpers', () => {
  it('normalizes separators and casing', () => {
    expect(normalizeVin(' wv w zzz 1kz 6w0 00001 ')).toBe('WVWZZZ1KZ6W000001');
  });

  it('accepts a standard 17-character VIN and rejects ambiguous characters', () => {
    expect(isValidVin('WVWZZZ1KZ6W000001')).toBe(true);
    expect(isValidVin('WVWZZZ1KZ6W00000I')).toBe(false);
  });
});
