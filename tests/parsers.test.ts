import { describe, expect, it } from 'vitest';
import { parseLocalizedDate, parseWeightGrams } from '../src/domain/parsers.js';

describe('localized input parsers', () => {
  it.each([
    ['88', 88_000], ['88.3 kg', 88_300], ['88,0 кг', 88_000], ['90.123', 90_123],
  ])('parses weight %s', (text, expected) => {
    expect(parseWeightGrams(text)).toBe(expected);
  });

  it('rejects ambiguous and unreasonable weights', () => {
    expect(parseWeightGrams('88 or 89')).toBeNull();
    expect(parseWeightGrams('12 kg')).toBeNull();
  });

  it.each([
    ['2026-12-31', '2026-12-31'],
    ['31.12.2026', '2026-12-31'],
    ['31 Dec 2026', '2026-12-31'],
    ['31 декабря 2026', '2026-12-31'],
    ['2026年12月31日', '2026-12-31'],
  ])('parses date %s', (text, expected) => {
    expect(parseLocalizedDate(text, 'Europe/Minsk')).toBe(expected);
  });

  it('rejects impossible dates', () => {
    expect(parseLocalizedDate('31.02.2026', 'Europe/Minsk')).toBeNull();
  });
});
