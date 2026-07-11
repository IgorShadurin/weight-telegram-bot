import { mkdir, writeFile } from 'node:fs/promises';
import { LANGUAGES } from '../src/config.js';
import { buildPeriods } from '../src/domain/periods.js';
import type { GoalPeriodRecord, GoalRecord, WeighInRecord } from '../src/domain/types.js';
import { renderGoalChart } from '../src/graphics/chart.js';

const goal: GoalRecord = {
  id: 'readme-example',
  telegramUserId: 'example-user',
  originChatId: 'example-chat',
  originThreadId: null,
  startDate: '2026-06-01',
  startWeightGrams: 92_000,
  targetWeightGrams: 80_000,
  targetDate: '2026-08-31',
  status: 'active',
  replacedByGoalId: null,
  endedAt: null,
  createdAt: '2026-06-01T09:00:00+03:00',
};

const periods: GoalPeriodRecord[] = buildPeriods({
  startDate: goal.startDate,
  targetDate: goal.targetDate,
  startWeightGrams: goal.startWeightGrams,
  targetWeightGrams: goal.targetWeightGrams,
  timezone: 'Europe/Minsk',
}).map((period) => ({
  id: `period-${period.periodIndex}`,
  goalId: goal.id,
  ...period,
  status: period.periodIndex <= 10 ? 'passed' : 'pending',
  passedAt: period.periodIndex <= 10 ? `${period.endDate}T09:00:00+03:00` : null,
  closedAt: period.periodIndex <= 10 ? `${period.endDate}T09:00:00+03:00` : null,
  badgeSentAt: period.periodIndex <= 10 ? `${period.endDate}T09:05:00+03:00` : null,
}));

const points = [
  ['2026-06-01', 92_000], ['2026-06-08', 91_300], ['2026-06-15', 90_700],
  ['2026-06-22', 90_100], ['2026-06-29', 89_000], ['2026-07-06', 88_500],
  ['2026-07-13', 87_400], ['2026-07-20', 86_900], ['2026-07-27', 85_600],
  ['2026-08-03', 84_900], ['2026-08-10', 84_100], ['2026-08-17', 82_900],
  ['2026-08-24', 82_100], ['2026-08-29', 81_300],
] as const;

const weighIns: WeighInRecord[] = points.map(([date, weightGrams], index) => {
  const period = periods.find((item) => date >= item.startDate && date <= item.endDate)!;
  return {
    id: `weigh-in-${index + 1}`,
    goalId: goal.id,
    periodId: period.id,
    telegramUserId: goal.telegramUserId,
    chatId: goal.originChatId,
    weightGrams,
    photoUniqueId: `example-photo-${index + 1}`,
    submittedAt: `${date}T09:00:00+03:00`,
  };
});

const filenames = {
  en: 'progress-chart-example.jpg', ru: 'progress-chart-example-ru.jpg', zh: 'progress-chart-example-zh.jpg',
  es: 'progress-chart-example-es.jpg', pt: 'progress-chart-example-pt.jpg', de: 'progress-chart-example-de.jpg',
  fr: 'progress-chart-example-fr.jpg', ja: 'progress-chart-example-ja.jpg', id: 'progress-chart-example-id.jpg',
} as const;

await mkdir('assets/readme', { recursive: true });
const images = await Promise.all(LANGUAGES.map(async (language) => ({
  language,
  image: await renderGoalChart({ goal, periods, weighIns, language, timezone: 'Europe/Minsk' }),
})));
await Promise.all(images.map(({ language, image }) => (
  writeFile(`assets/readme/${filenames[language]}`, image)
)));
console.log('Saved progress chart examples in all supported languages in assets/readme.');
