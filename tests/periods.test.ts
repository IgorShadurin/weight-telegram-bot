import { describe, expect, it } from 'vitest';
import { buildPeriods, formatKg, roundCheckpointGrams } from '../src/domain/periods.js';

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

  it('rounds checkpoint values to 50 grams', () => {
    expect(roundCheckpointGrams(88_824)).toBe(88_800);
    expect(roundCheckpointGrams(88_825)).toBe(88_850);
    expect(roundCheckpointGrams(88_876)).toBe(88_900);
  });

  it('keeps full-week losses 50-gram aligned and within one step', () => {
    const startWeightGrams = 93_050;
    const targetWeightGrams = 80_000;
    const periods = buildPeriods({
      startDate: '2026-07-11', targetDate: '2026-12-31',
      startWeightGrams, targetWeightGrams, timezone: 'Europe/Minsk',
    });
    const losses = periods.map((period, index) => {
      const previous = index === 0 ? startWeightGrams : periods[index - 1]!.targetWeightGrams;
      return previous - period.targetWeightGrams;
    });
    const fullWeekLosses = losses.slice(1, -1);

    expect(new Set(fullWeekLosses)).toEqual(new Set([500, 550]));
    expect(fullWeekLosses.every((loss) => loss % 50 === 0)).toBe(true);
    expect(Math.max(...fullWeekLosses) - Math.min(...fullWeekLosses)).toBeLessThanOrEqual(50);
    expect(losses[0]).toBeLessThanOrEqual(Math.min(...fullWeekLosses));
    expect(losses.at(-1)).toBeLessThanOrEqual(Math.min(...fullWeekLosses));
    expect(losses.reduce((sum, loss) => sum + loss, 0)).toBe(startWeightGrams - targetWeightGrams);
    expect(periods.at(-1)?.targetWeightGrams).toBe(targetWeightGrams);
  });

  it.each([
    ['2026-01-01', '2026-06-30', 92_000, 80_000],
    ['2026-01-04', '2026-12-31', 101_250, 79_900],
    ['2026-02-09', '2026-08-16', 88_875, 75_125],
  ])('preserves normalized monotonic schedules from %s to %s', (startDate, targetDate, startWeightGrams, targetWeightGrams) => {
    const periods = buildPeriods({ startDate, targetDate, startWeightGrams, targetWeightGrams, timezone: 'UTC' });
    const losses = periods.map((period, index) => {
      const previous = index === 0 ? startWeightGrams : periods[index - 1]!.targetWeightGrams;
      return previous - period.targetWeightGrams;
    });
    const interior = losses.slice(1, -1);

    expect(losses.every((loss) => loss >= 0)).toBe(true);
    expect(interior.every((loss) => loss % 50 === 0)).toBe(true);
    expect(Math.max(...interior) - Math.min(...interior)).toBeLessThanOrEqual(50);
    expect(losses.reduce((sum, loss) => sum + loss, 0)).toBe(startWeightGrams - targetWeightGrams);
    expect(periods.at(-1)?.targetWeightGrams).toBe(targetWeightGrams);
  });

  it('formats every displayed weight with at most two decimals, rounding upward', () => {
    expect(formatKg(91_333)).toBe('91.34');
    expect(formatKg(88_667)).toBe('88.67');
    expect(formatKg(83_333)).toBe('83.34');
    expect(formatKg(80_667)).toBe('80.67');
    expect(formatKg(92_000)).toBe('92');
    expect(formatKg(88_300)).toBe('88.3');
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
