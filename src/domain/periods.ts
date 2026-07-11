import { DateTime } from 'luxon';
import type { GoalPeriodRecord, PeriodDefinition } from './types.js';

// A hard upper bound prevents one crafted goal from creating an unbounded
// number of SQLite rows while still allowing long-term goals.
export const MAX_GOAL_DAYS = 3_660;

function date(value: string, zone: string): DateTime {
  const parsed = DateTime.fromISO(value, { zone }).startOf('day');
  if (!parsed.isValid) throw new Error(`Invalid date: ${value}`);
  return parsed;
}

export function roundCheckpointGrams(grams: number): number {
  return Math.round(grams / 100) * 100;
}

export function buildPeriods(input: {
  startDate: string;
  targetDate: string;
  startWeightGrams: number;
  targetWeightGrams: number;
  timezone: string;
}): PeriodDefinition[] {
  const start = date(input.startDate, input.timezone);
  const target = date(input.targetDate, input.timezone);
  const totalDays = target.diff(start, 'days').days;
  if (totalDays <= 0) throw new Error('Target date must be after the start date');
  if (totalDays > MAX_GOAL_DAYS) throw new Error('Target date is too far in the future');
  if (input.targetWeightGrams >= input.startWeightGrams) {
    throw new Error('Target weight must be lower than the start weight');
  }

  const periods: PeriodDefinition[] = [];
  let periodStart = start;
  let index = 1;

  while (periodStart <= target) {
    const daysUntilSunday = (7 - periodStart.weekday) % 7;
    const sunday = periodStart.plus({ days: daysUntilSunday });
    const periodEnd = sunday < target ? sunday : target;
    const elapsedDays = periodEnd.diff(start, 'days').days;
    const progress = Math.min(1, Math.max(0, elapsedDays / totalDays));
    const rawTarget = input.startWeightGrams + (input.targetWeightGrams - input.startWeightGrams) * progress;

    periods.push({
      periodIndex: index,
      startDate: periodStart.toISODate()!,
      endDate: periodEnd.toISODate()!,
      targetWeightGrams: periodEnd.equals(target) ? input.targetWeightGrams : roundCheckpointGrams(rawTarget),
    });

    if (periodEnd.equals(target)) break;
    periodStart = periodEnd.plus({ days: 1 });
    index += 1;
  }

  return periods;
}

export function periodForDate<T extends Pick<GoalPeriodRecord, 'startDate' | 'endDate'>>(
  periods: T[],
  localDate: string,
): T | null {
  return periods.find((period) => localDate >= period.startDate && localDate <= period.endDate) ?? null;
}

export function formatKg(grams: number): string {
  const kilograms = grams / 1000;
  return kilograms.toFixed(3).replace(/0+$/, '').replace(/[.,]$/, '');
}
