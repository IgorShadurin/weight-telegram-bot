import { createCanvas } from '@napi-rs/canvas';
import { DateTime } from 'luxon';
import type { Language } from '../config.js';
import { formatKg } from '../domain/periods.js';
import type { GoalPeriodRecord, GoalRecord } from '../domain/types.js';

const PERIODS_PER_PAGE = 54;

export interface GoalPlanRow {
  periodIndex: number;
  startDate: string;
  endDate: string;
  targetWeightGrams: number;
  lossGrams: number;
}

export interface GoalPlanModel {
  rows: GoalPlanRow[];
  totalLossGrams: number;
  averageLossGrams: number;
}

export function createGoalPlanModel(goal: GoalRecord, periods: GoalPeriodRecord[]): GoalPlanModel {
  let previousTarget = goal.startWeightGrams;
  const rows = periods.map((period) => {
    const row: GoalPlanRow = {
      periodIndex: period.periodIndex,
      startDate: period.startDate,
      endDate: period.endDate,
      targetWeightGrams: period.targetWeightGrams,
      lossGrams: Math.max(0, previousTarget - period.targetWeightGrams),
    };
    previousTarget = period.targetWeightGrams;
    return row;
  });
  const totalLossGrams = Math.max(0, goal.startWeightGrams - goal.targetWeightGrams);
  return {
    rows,
    totalLossGrams,
    averageLossGrams: rows.length === 0 ? 0 : Math.round(totalLossGrams / rows.length),
  };
}

function shortDate(value: string, language: Language): string {
  const locale = language === 'ru' ? 'ru' : 'en';
  return DateTime.fromISO(value, { zone: 'UTC' }).setLocale(locale).toFormat('dd LLL');
}

function dateRange(row: GoalPlanRow, language: Language): string {
  if (row.startDate === row.endDate) return shortDate(row.endDate, language);
  return `${shortDate(row.startDate, language)}–${shortDate(row.endDate, language)}`;
}

async function renderPage(input: {
  goal: GoalRecord;
  rows: GoalPlanRow[];
  language: Language;
  pageIndex: number;
  pageCount: number;
  totalPeriodCount: number;
}): Promise<Buffer> {
  const columns = input.rows.length <= 18 ? 1 : input.rows.length <= 36 ? 2 : 3;
  const rowsPerColumn = Math.ceil(input.rows.length / columns);
  const width = 1600;
  const rowHeight = 74;
  const tableTop = 410;
  const height = tableTop + rowsPerColumn * rowHeight + 120;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const colors = {
    paper: '#f4fbf8', panel: '#ffffff', ink: '#17322f', muted: '#6f827f',
    teal: '#10a58b', orange: '#ff9b42', line: '#dceae6', paleTeal: '#e6f7f2',
  };
  const unit = input.language === 'ru' ? 'кг' : 'kg';
  const gramUnit = input.language === 'ru' ? 'г' : 'g';
  const totalLoss = Math.max(0, input.goal.startWeightGrams - input.goal.targetWeightGrams);

  context.fillStyle = colors.paper;
  context.fillRect(0, 0, width, height);

  context.fillStyle = colors.ink;
  context.font = '700 52px sans-serif';
  context.fillText(input.language === 'ru' ? 'Маршрут по неделям' : 'Weekly roadmap', 70, 78);
  context.fillStyle = colors.muted;
  context.font = '28px sans-serif';
  context.fillText(
    `${formatKg(input.goal.startWeightGrams)} → ${formatKg(input.goal.targetWeightGrams)} ${unit}  •  ${input.goal.startDate} → ${input.goal.targetDate}`,
    70,
    125,
  );
  if (input.pageCount > 1) {
    context.textAlign = 'right';
    context.fillText(
      input.language === 'ru'
        ? `Страница ${input.pageIndex + 1} из ${input.pageCount}`
        : `Page ${input.pageIndex + 1} of ${input.pageCount}`,
      width - 70,
      78,
    );
    context.textAlign = 'left';
  }

  const summaryCards = [
    {
      label: input.language === 'ru' ? 'ВСЕГО СБРОСИТЬ' : 'TOTAL TO LOSE',
      value: `${totalLoss.toLocaleString(input.language === 'ru' ? 'ru-RU' : 'en-US')} ${gramUnit}`,
    },
    {
      label: input.language === 'ru' ? 'В СРЕДНЕМ ЗА НЕДЕЛЮ' : 'AVERAGE PER WEEK',
      value: `${Math.round(totalLoss / Math.max(1, input.totalPeriodCount)).toLocaleString(input.language === 'ru' ? 'ru-RU' : 'en-US')} ${gramUnit}`,
    },
  ];
  summaryCards.forEach((card, index) => {
    const x = 70 + index * 430;
    context.fillStyle = colors.panel;
    context.beginPath();
    context.roundRect(x, 166, 400, 126, 22);
    context.fill();
    context.fillStyle = index === 0 ? colors.orange : colors.teal;
    context.font = '700 19px sans-serif';
    context.fillText(card.label, x + 24, 205);
    context.fillStyle = colors.ink;
    context.font = '700 38px sans-serif';
    context.fillText(card.value, x + 24, 260);
  });

  context.fillStyle = colors.muted;
  context.font = '23px sans-serif';
  context.fillText(
    input.language === 'ru'
      ? 'Каждая строка: срок • целевой вес • сколько сбросить от прошлого рубежа'
      : 'Each row: deadline • target weight • loss from the previous checkpoint',
    70,
    340,
  );

  const margin = 70;
  const gap = 24;
  const columnWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  for (let column = 0; column < columns; column += 1) {
    const columnX = margin + column * (columnWidth + gap);
    context.fillStyle = colors.muted;
    context.font = '700 17px sans-serif';
    context.fillText(input.language === 'ru' ? 'НЕД.' : 'WK', columnX + 18, tableTop - 18);
    context.fillText(input.language === 'ru' ? 'ДАТЫ' : 'DATES', columnX + 76, tableTop - 18);
    context.fillText(input.language === 'ru' ? 'ЦЕЛЬ' : 'TARGET', columnX + columnWidth - 205, tableTop - 18);
    context.fillText(input.language === 'ru' ? 'СБРОСИТЬ' : 'TO LOSE', columnX + columnWidth - 100, tableTop - 18);
  }

  input.rows.forEach((row, index) => {
    const column = Math.floor(index / rowsPerColumn);
    const rowInColumn = index % rowsPerColumn;
    const x = margin + column * (columnWidth + gap);
    const y = tableTop + rowInColumn * rowHeight;
    context.fillStyle = row.periodIndex % 2 === 0 ? colors.panel : colors.paleTeal;
    context.beginPath();
    context.roundRect(x, y, columnWidth, rowHeight - 8, 14);
    context.fill();

    context.fillStyle = colors.teal;
    context.font = '700 21px sans-serif';
    context.fillText(String(row.periodIndex).padStart(2, '0'), x + 18, y + 42);
    context.fillStyle = colors.ink;
    context.font = '20px sans-serif';
    context.fillText(dateRange(row, input.language), x + 76, y + 42);

    context.textAlign = 'right';
    context.font = '700 23px sans-serif';
    context.fillText(`≤ ${formatKg(row.targetWeightGrams)}`, x + columnWidth - 112, y + 42);
    context.fillStyle = colors.orange;
    context.font = '700 20px sans-serif';
    context.fillText(`-${row.lossGrams} ${gramUnit}`, x + columnWidth - 18, y + 42);
    context.textAlign = 'left';
  });

  context.strokeStyle = colors.line;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(margin, height - 65);
  context.lineTo(width - margin, height - 65);
  context.stroke();
  context.fillStyle = colors.muted;
  context.font = '20px sans-serif';
  context.fillText(
    input.language === 'ru'
      ? `Целевой вес указан в ${unit}; недельное изменение — в ${gramUnit}.`
      : `Target weight is shown in ${unit}; weekly change is shown in ${gramUnit}.`,
    margin,
    height - 28,
  );

  return canvas.encode('jpeg', 90);
}

export async function renderGoalPlanPages(input: {
  goal: GoalRecord;
  periods: GoalPeriodRecord[];
  language: Language;
}): Promise<Buffer[]> {
  const model = createGoalPlanModel(input.goal, input.periods);
  const chunks: GoalPlanRow[][] = [];
  for (let index = 0; index < model.rows.length; index += PERIODS_PER_PAGE) {
    chunks.push(model.rows.slice(index, index + PERIODS_PER_PAGE));
  }
  return Promise.all(chunks.map((rows, pageIndex) => renderPage({
    goal: input.goal,
    rows,
    language: input.language,
    pageIndex,
    pageCount: chunks.length,
    totalPeriodCount: model.rows.length,
  })));
}
