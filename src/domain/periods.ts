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
  return Math.round(grams / 50) * 50;
}

function distributeLossGrams(totalLossGrams: number, durations: number[]): number[] {
  if (durations.length === 1) return [totalLossGrams];

  const unitGrams = 50;
  const totalUnits = Math.floor(totalLossGrams / unitGrams);
  const residualGrams = totalLossGrams - totalUnits * unitGrams;
  const totalDays = durations.reduce((sum, days) => sum + days, 0);
  const units = Array.from({ length: durations.length }, () => 0);
  const edgeIndexes = [0, durations.length - 1];

  for (const index of edgeIndexes) {
    units[index] = Math.round((totalUnits * durations[index]!) / totalDays);
  }

  while (units[0]! + units.at(-1)! > totalUnits) {
    const index = units[0]! >= units.at(-1)! ? 0 : units.length - 1;
    units[index] = Math.max(0, units[index]! - 1);
  }

  const interiorCount = Math.max(0, durations.length - 2);
  if (interiorCount > 0) {
    const remainingUnits = totalUnits - units[0]! - units.at(-1)!;
    const baseUnits = Math.floor(remainingUnits / interiorCount);
    const extraUnits = remainingUnits % interiorCount;

    for (let offset = 0; offset < interiorCount; offset += 1) {
      // Keep the plan visually steady instead of alternating (for example,
      // 500/550/500/550). The slightly larger full-week checkpoints form one
      // block followed by the smaller checkpoints, so there is at most one
      // change in the weekly amount.
      units[offset + 1] = baseUnits + (offset < extraUnits ? 1 : 0);
    }
  } else {
    units[units.length - 1] = totalUnits - units[0]!;
  }

  const losses = units.map((value) => value * unitGrams);
  losses[losses.length - 1] = losses.at(-1)! + residualGrams;
  return losses;
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

  const boundaries: Array<{ startDate: string; endDate: string; durationDays: number }> = [];
  let periodStart = start;
  let previousDeadline = start;

  while (periodStart <= target) {
    const daysUntilSunday = (7 - periodStart.weekday) % 7;
    const sunday = periodStart.plus({ days: daysUntilSunday });
    const periodEnd = sunday < target ? sunday : target;
    boundaries.push({
      startDate: periodStart.toISODate()!,
      endDate: periodEnd.toISODate()!,
      durationDays: periodEnd.diff(previousDeadline, 'days').days,
    });

    if (periodEnd.equals(target)) break;
    previousDeadline = periodEnd;
    periodStart = periodEnd.plus({ days: 1 });
  }

  const totalLossGrams = input.startWeightGrams - input.targetWeightGrams;
  const losses = distributeLossGrams(totalLossGrams, boundaries.map((period) => period.durationDays));
  let targetWeightGrams = input.startWeightGrams;

  return boundaries.map((period, index) => {
    targetWeightGrams -= losses[index]!;
    return {
      periodIndex: index + 1,
      startDate: period.startDate,
      endDate: period.endDate,
      targetWeightGrams: index === boundaries.length - 1 ? input.targetWeightGrams : targetWeightGrams,
    };
  });
}

export function typicalWeeklyLossGrams(
  startWeightGrams: number,
  periods: Array<Pick<PeriodDefinition, 'targetWeightGrams'>>,
): number {
  const losses = periods.map((period, index) => {
    const previous = index === 0 ? startWeightGrams : periods[index - 1]!.targetWeightGrams;
    return Math.max(0, previous - period.targetWeightGrams);
  });
  const typical = losses.length > 2 ? losses.slice(1, -1) : losses;
  const sorted = typical.toSorted((left, right) => left - right);
  return sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]!;
}

export function periodForDate<T extends Pick<GoalPeriodRecord, 'startDate' | 'endDate'>>(
  periods: T[],
  localDate: string,
): T | null {
  return periods.find((period) => localDate >= period.startDate && localDate <= period.endDate) ?? null;
}

export function formatKg(grams: number): string {
  const hundredths = Math.ceil(grams / 10);
  return (hundredths / 100).toFixed(2).replace(/0+$/, '').replace(/[.,]$/, '');
}
