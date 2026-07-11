import { createCanvas } from '@napi-rs/canvas';
import { DateTime } from 'luxon';
import type { Language } from '../config.js';
import { formatKg, typicalWeeklyLossGrams } from '../domain/periods.js';
import type { GoalPeriodRecord, GoalRecord } from '../domain/types.js';

const PERIODS_PER_PAGE = 54;
const FONT_FAMILY = '"Noto Sans CJK SC", "Noto Sans CJK JP", "Arial Unicode MS", sans-serif';

function localized(language: Language, values: Record<Language, string>): string {
  return values[language];
}

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
  typicalLossGrams: number;
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
    typicalLossGrams: typicalWeeklyLossGrams(goal.startWeightGrams, periods),
  };
}

function shortDate(value: string, language: Language): string {
  const locale = localized(language, {
    ru: 'ru', en: 'en', zh: 'zh-CN', es: 'es', pt: 'pt-BR', de: 'de', fr: 'fr', ja: 'ja', id: 'id-ID',
  });
  const format = language === 'zh' || language === 'ja' ? 'MM月dd日' : 'dd LLL';
  return DateTime.fromISO(value, { zone: 'UTC' }).setLocale(locale).toFormat(format);
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
  typicalLossGrams: number;
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
  const unit = localized(input.language, {
    ru: 'кг', en: 'kg', zh: '公斤', es: 'kg', pt: 'kg', de: 'kg', fr: 'kg', ja: 'kg', id: 'kg',
  });
  const gramUnit = localized(input.language, {
    ru: 'г', en: 'g', zh: '克', es: 'g', pt: 'g', de: 'g', fr: 'g', ja: 'g', id: 'g',
  });
  const numberLocale = localized(input.language, {
    ru: 'ru-RU', en: 'en-US', zh: 'zh-CN', es: 'es-ES', pt: 'pt-BR', de: 'de-DE', fr: 'fr-FR', ja: 'ja-JP', id: 'id-ID',
  });
  const totalLoss = Math.max(0, input.goal.startWeightGrams - input.goal.targetWeightGrams);

  context.fillStyle = colors.paper;
  context.fillRect(0, 0, width, height);

  context.fillStyle = colors.ink;
  context.font = `700 52px ${FONT_FAMILY}`;
  context.fillText(localized(input.language, {
    ru: 'Маршрут по неделям', en: 'Weekly roadmap', zh: '每周闯关地图', es: 'Ruta semana a semana', pt: 'Rota semana a semana',
    de: 'Wochenfahrplan', fr: 'Feuille de route', ja: '週ごとのロードマップ', id: 'Peta jalan mingguan',
  }), 70, 78);
  context.fillStyle = colors.muted;
  context.font = `28px ${FONT_FAMILY}`;
  context.fillText(
    `${formatKg(input.goal.startWeightGrams)} → ${formatKg(input.goal.targetWeightGrams)} ${unit}  •  ${input.goal.startDate} → ${input.goal.targetDate}`,
    70,
    125,
  );
  if (input.pageCount > 1) {
    context.textAlign = 'right';
    context.fillText(
      localized(input.language, {
        ru: `Страница ${input.pageIndex + 1} из ${input.pageCount}`,
        en: `Page ${input.pageIndex + 1} of ${input.pageCount}`,
        zh: `第 ${input.pageIndex + 1} / ${input.pageCount} 页`,
        es: `Página ${input.pageIndex + 1} de ${input.pageCount}`,
        pt: `Página ${input.pageIndex + 1} de ${input.pageCount}`,
        de: `Seite ${input.pageIndex + 1} von ${input.pageCount}`,
        fr: `Page ${input.pageIndex + 1} sur ${input.pageCount}`,
        ja: `${input.pageIndex + 1} / ${input.pageCount} ページ`,
        id: `Halaman ${input.pageIndex + 1} dari ${input.pageCount}`,
      }),
      width - 70,
      78,
    );
    context.textAlign = 'left';
  }

  const summaryCards = [
    {
      label: localized(input.language, {
        ru: 'ВСЕГО СБРОСИТЬ', en: 'TOTAL TO LOSE', zh: '总共要减', es: 'TOTAL A PERDER', pt: 'TOTAL A PERDER',
        de: 'GESAMT ABNEHMEN', fr: 'TOTAL À PERDRE', ja: '減量合計', id: 'TOTAL TURUN',
      }),
      value: `${totalLoss.toLocaleString(numberLocale)} ${gramUnit}`,
    },
    {
      label: localized(input.language, {
        ru: 'В СРЕДНЕМ ЗА НЕДЕЛЮ', en: 'AVERAGE PER WEEK', zh: '平均每周', es: 'MEDIA POR SEMANA', pt: 'MÉDIA POR SEMANA',
        de: 'Ø PRO WOCHE', fr: 'MOYENNE / SEMAINE', ja: '週平均', id: 'RATA-RATA / MINGGU',
      }),
      value: `${input.typicalLossGrams.toLocaleString(numberLocale)} ${gramUnit}`,
    },
  ];
  summaryCards.forEach((card, index) => {
    const x = 70 + index * 430;
    context.fillStyle = colors.panel;
    context.beginPath();
    context.roundRect(x, 166, 400, 126, 22);
    context.fill();
    context.fillStyle = index === 0 ? colors.orange : colors.teal;
    context.font = `700 19px ${FONT_FAMILY}`;
    context.fillText(card.label, x + 24, 205);
    context.fillStyle = colors.ink;
    context.font = `700 38px ${FONT_FAMILY}`;
    context.fillText(card.value, x + 24, 260);
  });

  context.fillStyle = colors.muted;
  context.font = `23px ${FONT_FAMILY}`;
  context.fillText(
    localized(input.language, {
      ru: 'Каждая строка: срок • целевой вес • сколько сбросить от прошлого рубежа',
      en: 'Each row: deadline • target weight • loss from the previous checkpoint',
      zh: '每行：截止日期 • 目标体重 • 较上个目标需减重',
      es: 'Cada fila: fecha límite • peso objetivo • pérdida desde el punto anterior',
      pt: 'Cada linha: prazo • peso-alvo • perda desde o checkpoint anterior',
      de: 'Jede Zeile: Frist • Zielgewicht • Minus seit der letzten Etappe',
      fr: 'Chaque ligne : échéance • poids cible • perte depuis le palier précédent',
      ja: '各行：期限 • 目標体重 • 前の目標から減らす量',
      id: 'Setiap baris: tenggat • target berat • penurunan dari pos sebelumnya',
    }),
    70,
    340,
  );

  const margin = 70;
  const gap = 24;
  const columnWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  for (let column = 0; column < columns; column += 1) {
    const columnX = margin + column * (columnWidth + gap);
    context.fillStyle = colors.muted;
    context.font = `700 17px ${FONT_FAMILY}`;
    context.fillText(localized(input.language, { ru: 'НЕД.', en: 'WK', zh: '周', es: 'SEM', pt: 'SEM', de: 'WO', fr: 'SEM', ja: '週', id: 'MG' }), columnX + 18, tableTop - 18);
    context.fillText(localized(input.language, { ru: 'ДАТЫ', en: 'DATES', zh: '日期', es: 'FECHAS', pt: 'DATAS', de: 'DATUM', fr: 'DATES', ja: '日付', id: 'TANGGAL' }), columnX + 76, tableTop - 18);
    context.fillText(localized(input.language, { ru: 'ЦЕЛЬ', en: 'TARGET', zh: '目标', es: 'META', pt: 'META', de: 'ZIEL', fr: 'CIBLE', ja: '目標', id: 'TARGET' }), columnX + columnWidth - 205, tableTop - 18);
    context.fillText(localized(input.language, { ru: 'СБРОСИТЬ', en: 'TO LOSE', zh: '需减', es: 'BAJAR', pt: 'PERDER', de: 'MINUS', fr: 'PERDRE', ja: '減量', id: 'TURUN' }), columnX + columnWidth - 100, tableTop - 18);
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
    context.font = `700 21px ${FONT_FAMILY}`;
    context.fillText(String(row.periodIndex).padStart(2, '0'), x + 18, y + 42);
    context.fillStyle = colors.ink;
    context.font = `20px ${FONT_FAMILY}`;
    context.fillText(dateRange(row, input.language), x + 76, y + 42);

    context.textAlign = 'right';
    context.font = `700 23px ${FONT_FAMILY}`;
    context.fillText(`≤ ${formatKg(row.targetWeightGrams)}`, x + columnWidth - 112, y + 42);
    context.fillStyle = colors.orange;
    context.font = `700 20px ${FONT_FAMILY}`;
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
  context.font = `20px ${FONT_FAMILY}`;
  context.fillText(
    localized(input.language, {
      ru: `Целевой вес указан в ${unit}; недельное изменение — в ${gramUnit}.`,
      en: `Target weight is shown in ${unit}; weekly change is shown in ${gramUnit}.`,
      zh: `目标体重单位为${unit}；每周变化单位为${gramUnit}。`,
      es: `El peso objetivo está en ${unit}; el cambio semanal, en ${gramUnit}.`,
      pt: `O peso-alvo está em ${unit}; a mudança semanal, em ${gramUnit}.`,
      de: `Zielgewicht in ${unit}; wöchentliche Änderung in ${gramUnit}.`,
      fr: `Poids cible en ${unit} ; variation hebdomadaire en ${gramUnit}.`,
      ja: `目標体重は${unit}、週ごとの変化は${gramUnit}で表示。`,
      id: `Target berat dalam ${unit}; perubahan mingguan dalam ${gramUnit}.`,
    }),
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
    typicalLossGrams: model.typicalLossGrams,
  })));
}
