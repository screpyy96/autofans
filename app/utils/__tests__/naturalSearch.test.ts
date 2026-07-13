import { describe, expect, it } from 'vitest';
import { parseNaturalSearch } from '~/utils/naturalSearch';

describe('parseNaturalSearch', () => {
  it('turns Romanian natural language into filters', () => {
    const result = parseNaturalSearch('BMW diesel automată sub 15.000 euro în Cluj 2020');
    expect(result.filters).toMatchObject({ brand: ['BMW'], priceRange: { max: 15000 }, yearRange: { min: 2020, max: 2020 }, location: { city: 'Cluj-Napoca' } });
    expect(result.remainingQuery).toBe('in');
  });
});

it('parses a location radius without leaving location words in the text query', () => {
  const result = parseNaturalSearch('BMW în 50 km de Cluj-Napoca');
  expect(result.filters.location?.city).toBe('Cluj-Napoca');
  expect(result.filters.radius).toBe(50);
  expect(result.remainingQuery).toBe('');
});
