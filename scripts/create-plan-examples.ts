import { mkdir, writeFile } from 'node:fs/promises';
import { buildPeriods } from '../src/domain/periods.js';
import type { GoalPeriodRecord, GoalRecord } from '../src/domain/types.js';
import { renderGoalPlanPages } from '../src/graphics/plan.js';

function exampleGoal(id: string, targetDate: string, targetWeightGrams: number): {
  goal: GoalRecord;
  periods: GoalPeriodRecord[];
} {
  const goal: GoalRecord = {
    id,
    telegramUserId: 'example-user',
    originChatId: 'example-chat',
    originThreadId: null,
    startDate: '2026-07-11',
    startWeightGrams: 92_000,
    targetWeightGrams,
    targetDate,
    status: 'active',
    replacedByGoalId: null,
    endedAt: null,
    createdAt: '2026-07-11T10:00:00+03:00',
  };
  const periods = buildPeriods({
    startDate: goal.startDate,
    targetDate: goal.targetDate,
    startWeightGrams: goal.startWeightGrams,
    targetWeightGrams: goal.targetWeightGrams,
    timezone: 'Europe/Minsk',
  }).map((period) => ({
    id: `${id}-period-${period.periodIndex}`,
    goalId: id,
    ...period,
    status: 'pending' as const,
    passedAt: null,
    closedAt: null,
    badgeSentAt: null,
  }));
  return { goal, periods };
}

const sixMonths = exampleGoal('six-month-example', '2027-01-11', 82_000);
const twelveMonths = exampleGoal('twelve-month-example', '2027-07-11', 72_000);
const [sixEn, sixRu, sixZh, twelveEn, twelveRu, twelveZh] = await Promise.all([
  renderGoalPlanPages({ ...sixMonths, language: 'en' }),
  renderGoalPlanPages({ ...sixMonths, language: 'ru' }),
  renderGoalPlanPages({ ...sixMonths, language: 'zh' }),
  renderGoalPlanPages({ ...twelveMonths, language: 'en' }),
  renderGoalPlanPages({ ...twelveMonths, language: 'ru' }),
  renderGoalPlanPages({ ...twelveMonths, language: 'zh' }),
]);

if ([sixEn, sixRu, sixZh, twelveEn, twelveRu, twelveZh].some((pages) => pages.length !== 1)) {
  throw new Error('README roadmap examples must fit on one image each.');
}

await mkdir('assets/readme', { recursive: true });
await Promise.all([
  writeFile('assets/readme/weekly-roadmap-6-months-en.jpg', sixEn[0]!),
  writeFile('assets/readme/weekly-roadmap-6-months-ru.jpg', sixRu[0]!),
  writeFile('assets/readme/weekly-roadmap-6-months-zh.jpg', sixZh[0]!),
  writeFile('assets/readme/weekly-roadmap-12-months-en.jpg', twelveEn[0]!),
  writeFile('assets/readme/weekly-roadmap-12-months-ru.jpg', twelveRu[0]!),
  writeFile('assets/readme/weekly-roadmap-12-months-zh.jpg', twelveZh[0]!),
]);
console.log('Saved 6- and 12-month roadmap examples in English, Russian, and Chinese.');
