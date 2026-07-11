import { describe, expect, it } from 'vitest';
import { achievements } from '../src/i18n/achievements.js';
import { variants } from '../src/i18n/catalog.js';
import { createChartModel, renderGoalChart } from '../src/graphics/chart.js';
import type { GoalPeriodRecord, GoalRecord, WeighInRecord } from '../src/domain/types.js';

const goal: GoalRecord = {
  id: 'g', telegramUserId: '1', originChatId: '-1', originThreadId: null,
  startDate: '2026-07-01', startWeightGrams: 92_000, targetWeightGrams: 80_000,
  targetDate: '2026-12-31', status: 'active', replacedByGoalId: null, endedAt: null,
  createdAt: '2026-07-01T10:00:00Z',
};
const periods: GoalPeriodRecord[] = [1, 2, 3].map((periodIndex) => ({
  id: `p${periodIndex}`, goalId: 'g', periodIndex,
  startDate: `2026-07-${String(1 + (periodIndex - 1) * 7).padStart(2, '0')}`,
  endDate: `2026-07-${String(7 + (periodIndex - 1) * 7).padStart(2, '0')}`,
  targetWeightGrams: 92_000 - periodIndex * 500, status: 'pending', passedAt: null, closedAt: null, badgeSentAt: null,
}));
const weighIns: WeighInRecord[] = Array.from({ length: 30 }, (_, index) => ({
  id: `w${index}`, goalId: 'g', periodId: 'p1', telegramUserId: '1', chatId: '-1',
  weightGrams: 92_000 - index * 100, photoUniqueId: `f${index}`,
  submittedAt: `2026-07-${String(1 + Math.floor(index / 2)).padStart(2, '0')}T10:00:00Z`,
}));

describe('graphics and fixed catalogs', () => {
  it('contains 53 unique bilingual achievements and 10 copy variants', () => {
    expect(achievements).toHaveLength(53);
    expect(new Set(achievements.map((item) => item.title.en)).size).toBe(53);
    expect(new Set(achievements.map((item) => item.title.ru)).size).toBe(53);
    for (const category of Object.values(variants)) {
      expect(category.en).toHaveLength(10);
      expect(category.ru).toHaveLength(10);
    }
  });

  it('keeps every weight in the chart model and highlights two periods', () => {
    const model = createChartModel(goal, periods, weighIns, 'Europe/Minsk');
    expect(model.points).toHaveLength(30);
    expect(model.highlightedPeriods.map((item) => item.periodIndex)).toEqual([2, 3]);
  });

  it('renders a Telegram-safe JPEG without writing it to disk', async () => {
    const image = await renderGoalChart({ goal, periods, weighIns, language: 'en', timezone: 'Europe/Minsk' });
    expect(image.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    expect(image.byteLength).toBeLessThan(10 * 1024 * 1024);
  });
});
