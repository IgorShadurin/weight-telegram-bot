import { createCanvas } from '@napi-rs/canvas';
import { DateTime } from 'luxon';
import type { Language } from '../config.js';
import { formatKg } from '../domain/periods.js';
import type { GoalPeriodRecord, GoalRecord, WeighInRecord } from '../domain/types.js';

export interface ChartPoint {
  at: number;
  date: string;
  weightGrams: number;
}

export interface ChartModel {
  points: ChartPoint[];
  goalLine: Array<{ at: number; weightGrams: number }>;
  highlightedPeriods: GoalPeriodRecord[];
  minWeight: number;
  maxWeight: number;
  startAt: number;
  endAt: number;
}

const FONT_FAMILY = '"Noto Sans CJK SC", "Arial Unicode MS", sans-serif';

function localized(language: Language, values: Record<Language, string>): string {
  return values[language];
}

function localNoon(date: string, timezone: string): number {
  return DateTime.fromISO(date, { zone: timezone }).set({ hour: 12 }).toMillis();
}

export function createChartModel(
  goal: GoalRecord,
  periods: GoalPeriodRecord[],
  weighIns: WeighInRecord[],
  timezone: string,
): ChartModel {
  const points = weighIns.map((item) => ({
    at: DateTime.fromISO(item.submittedAt).setZone(timezone).toMillis(),
    date: DateTime.fromISO(item.submittedAt).setZone(timezone).toISODate()!,
    weightGrams: item.weightGrams,
  }));
  const startAt = localNoon(goal.startDate, timezone);
  const endAt = localNoon(goal.targetDate, timezone);
  const allWeights = [goal.startWeightGrams, goal.targetWeightGrams, ...points.map((point) => point.weightGrams)];
  const padding = Math.max(1000, (Math.max(...allWeights) - Math.min(...allWeights)) * 0.12);

  return {
    points,
    goalLine: [
      { at: startAt, weightGrams: goal.startWeightGrams },
      { at: endAt, weightGrams: goal.targetWeightGrams },
    ],
    highlightedPeriods: periods.slice(-2),
    minWeight: Math.floor((Math.min(...allWeights) - padding) / 1000) * 1000,
    maxWeight: Math.ceil((Math.max(...allWeights) + padding) / 1000) * 1000,
    startAt,
    endAt,
  };
}

export async function renderGoalChart(input: {
  goal: GoalRecord;
  periods: GoalPeriodRecord[];
  weighIns: WeighInRecord[];
  language: Language;
  timezone: string;
}): Promise<Buffer> {
  const model = createChartModel(input.goal, input.periods, input.weighIns, input.timezone);
  const canvas = createCanvas(1600, 1000);
  const context = canvas.getContext('2d');
  const colors = {
    ink: '#17322f', muted: '#6f827f', grid: '#dceae6', teal: '#10a58b', orange: '#ff9b42',
    lime: '#9de65c', paper: '#f5fbf9', panel: '#ffffff', red: '#ef6262',
  };
  const unit = localized(input.language, { ru: 'кг', en: 'kg', zh: '公斤' });

  context.fillStyle = colors.paper;
  context.fillRect(0, 0, 1600, 1000);
  context.fillStyle = colors.ink;
  context.font = `700 48px ${FONT_FAMILY}`;
  context.fillText(localized(input.language, { ru: 'Траектория веса', en: 'Weight trajectory', zh: '体重轨迹' }), 76, 78);
  context.fillStyle = colors.muted;
  context.font = `28px ${FONT_FAMILY}`;
  context.fillText(`${formatKg(input.goal.startWeightGrams)} → ${formatKg(input.goal.targetWeightGrams)} ${unit}`, 76, 120);

  const lastTwo = model.highlightedPeriods;
  lastTwo.forEach((period, index) => {
    const x = 930 + index * 290;
    context.fillStyle = colors.panel;
    context.beginPath();
    context.roundRect(x, 38, 260, 112, 22);
    context.fill();
    context.fillStyle = period.status === 'passed' ? colors.teal : period.status === 'missed' ? colors.red : colors.orange;
    context.font = `700 24px ${FONT_FAMILY}`;
    context.fillText(localized(input.language, {
      ru: `Неделя ${period.periodIndex}`,
      en: `Week ${period.periodIndex}`,
      zh: `第 ${period.periodIndex} 周`,
    }), x + 24, 76);
    context.fillStyle = colors.ink;
    context.font = `700 34px ${FONT_FAMILY}`;
    context.fillText(`≤ ${formatKg(period.targetWeightGrams)} ${unit}`, x + 24, 122);
  });

  const plot = { left: 120, top: 210, width: 1390, height: 650 };
  const x = (at: number) => plot.left + ((at - model.startAt) / Math.max(1, model.endAt - model.startAt)) * plot.width;
  const y = (weight: number) => plot.top + ((model.maxWeight - weight) / Math.max(1, model.maxWeight - model.minWeight)) * plot.height;

  for (const period of model.highlightedPeriods) {
    const left = Math.max(plot.left, x(localNoon(period.startDate, input.timezone)));
    const right = Math.min(plot.left + plot.width, x(localNoon(period.endDate, input.timezone)));
    context.fillStyle = period.periodIndex % 2 === 0 ? '#e9f8f1' : '#fff4e8';
    context.fillRect(left, plot.top, Math.max(5, right - left), plot.height);
  }

  context.strokeStyle = colors.grid;
  context.lineWidth = 2;
  context.fillStyle = colors.muted;
  context.font = `22px ${FONT_FAMILY}`;
  const gridLines = 6;
  for (let index = 0; index <= gridLines; index += 1) {
    const weight = model.maxWeight - ((model.maxWeight - model.minWeight) * index) / gridLines;
    const lineY = plot.top + (plot.height * index) / gridLines;
    context.beginPath();
    context.moveTo(plot.left, lineY);
    context.lineTo(plot.left + plot.width, lineY);
    context.stroke();
    context.fillText(formatKg(Math.round(weight)), 34, lineY + 8);
  }

  context.setLineDash([18, 14]);
  context.strokeStyle = colors.orange;
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(x(model.goalLine[0]!.at), y(model.goalLine[0]!.weightGrams));
  context.lineTo(x(model.goalLine[1]!.at), y(model.goalLine[1]!.weightGrams));
  context.stroke();
  context.setLineDash([]);

  if (model.points.length > 0) {
    context.strokeStyle = colors.teal;
    context.lineWidth = 8;
    context.lineJoin = 'round';
    context.beginPath();
    model.points.forEach((point, index) => {
      const pointX = x(point.at);
      const pointY = y(point.weightGrams);
      if (index === 0) context.moveTo(pointX, pointY);
      else context.lineTo(pointX, pointY);
    });
    context.stroke();

    model.points.forEach((point, index) => {
      const pointX = x(point.at);
      const pointY = y(point.weightGrams);
      context.fillStyle = colors.panel;
      context.beginPath();
      context.arc(pointX, pointY, 13, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = colors.teal;
      context.lineWidth = 7;
      context.stroke();

      const showLabel = model.points.length <= 18 || index === 0 || index === model.points.length - 1 || index % Math.ceil(model.points.length / 12) === 0;
      if (showLabel) {
        const label = formatKg(point.weightGrams);
        context.font = `700 20px ${FONT_FAMILY}`;
        const width = context.measureText(label).width + 22;
        const labelY = pointY + (index % 2 === 0 ? -42 : 58);
        context.fillStyle = colors.panel;
        context.beginPath();
        context.roundRect(pointX - width / 2, labelY - 27, width, 36, 10);
        context.fill();
        context.fillStyle = colors.ink;
        context.fillText(label, pointX - width / 2 + 11, labelY);
      }
    });
  }

  context.fillStyle = colors.muted;
  context.font = `22px ${FONT_FAMILY}`;
  context.fillText(input.goal.startDate, plot.left, 914);
  const endLabel = input.goal.targetDate;
  context.fillText(endLabel, plot.left + plot.width - context.measureText(endLabel).width, 914);

  context.strokeStyle = colors.teal;
  context.lineWidth = 8;
  context.beginPath(); context.moveTo(76, 960); context.lineTo(126, 960); context.stroke();
  context.fillStyle = colors.ink; context.font = `22px ${FONT_FAMILY}`;
  context.fillText(localized(input.language, { ru: 'Фактический вес', en: 'Actual weight', zh: '实际体重' }), 142, 968);
  context.setLineDash([12, 10]); context.strokeStyle = colors.orange;
  context.beginPath(); context.moveTo(410, 960); context.lineTo(460, 960); context.stroke(); context.setLineDash([]);
  context.fillText(localized(input.language, { ru: 'Линия цели', en: 'Goal line', zh: '目标线' }), 476, 968);

  return canvas.encode('jpeg', 88);
}
