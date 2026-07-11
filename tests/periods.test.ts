import { describe, expect, it } from 'vitest';
import { buildPeriods, roundCheckpointGrams } from '../src/domain/periods.js';

describe('weekly periods', () => {
  it('ends on Sundays and uses the exact final partial date', () => {
    const periods = buildPeriods({
      startDate: '2026-07-08',
      targetDate: '2026-07-21',
      startWeightGrams: 92_000,
      targetWeightGrams: 80_000,
      timezone: 'Europe/Minsk',
    });
    expect(periods.map((period) => period.endDate)).toEqual(['2026-07-12', '2026-07-19', '2026-07-21']);
    expect(periods.at(-1)?.targetWeightGrams).toBe(80_000);
    expect(periods[0]?.targetWeightGrams).toBe(88_300);
  });

  it('allows a one-day first period when a goal starts Sunday', () => {
    const periods = buildPeriods({
      startDate: '2026-07-12', targetDate: '2026-07-20',
      startWeightGrams: 90_000, targetWeightGrams: 88_000, timezone: 'Europe/Minsk',
    });
    expect(periods[0]).toMatchObject({ startDate: '2026-07-12', endDate: '2026-07-12', targetWeightGrams: 90_000 });
    expect(periods.at(-1)?.endDate).toBe('2026-07-20');
  });

  it('supports goals longer than 53 weeks', () => {
    const periods = buildPeriods({
      startDate: '2026-01-01', targetDate: '2027-12-31',
      startWeightGrams: 120_000, targetWeightGrams: 80_000, timezone: 'Europe/Minsk',
    });
    expect(periods.length).toBeGreaterThan(53);
  });

  it('rounds checkpoint values to 0.1 kg', () => {
    expect(roundCheckpointGrams(88_849)).toBe(88_800);
    expect(roundCheckpointGrams(88_850)).toBe(88_900);
  });

  it('rejects non-loss and non-future goals', () => {
    expect(() => buildPeriods({
      startDate: '2026-01-01', targetDate: '2026-01-01',
      startWeightGrams: 90_000, targetWeightGrams: 80_000, timezone: 'UTC',
    })).toThrow();
    expect(() => buildPeriods({
      startDate: '2026-01-01', targetDate: '2026-02-01',
      startWeightGrams: 80_000, targetWeightGrams: 90_000, timezone: 'UTC',
    })).toThrow();
  });

  it('rejects goals whose duration could create excessive database rows', () => {
    expect(() => buildPeriods({
      startDate: '2026-01-01', targetDate: '2037-01-01',
      startWeightGrams: 90_000, targetWeightGrams: 80_000, timezone: 'UTC',
    })).toThrow('too far');
  });
});
