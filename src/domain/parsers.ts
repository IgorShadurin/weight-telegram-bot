import { DateTime } from 'luxon';

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, enero: 1, janeiro: 1, januar: 1, janvier: 1, januari: 1, янв: 1, январь: 1, января: 1,
  feb: 2, february: 2, febrero: 2, fevereiro: 2, februar: 2, février: 2, februari: 2, фев: 2, февраль: 2, февраля: 2,
  mar: 3, march: 3, marzo: 3, março: 3, märz: 3, mars: 3, maret: 3, мар: 3, март: 3, марта: 3,
  apr: 4, april: 4, abril: 4, avril: 4, апр: 4, апрель: 4, апреля: 4,
  may: 5, mayo: 5, maio: 5, mai: 5, mei: 5, май: 5, мая: 5,
  jun: 6, june: 6, junio: 6, junho: 6, juni: 6, juin: 6, июн: 6, июнь: 6, июня: 6,
  jul: 7, july: 7, julio: 7, julho: 7, juli: 7, juillet: 7, июл: 7, июль: 7, июля: 7,
  aug: 8, august: 8, agosto: 8, août: 8, agustus: 8, авг: 8, август: 8, августа: 8,
  sep: 9, sept: 9, september: 9, septiembre: 9, setembro: 9, septembre: 9, сен: 9, сент: 9, сентябрь: 9, сентября: 9,
  oct: 10, october: 10, octubre: 10, outubro: 10, oktober: 10, octobre: 10, окт: 10, октябрь: 10, октября: 10,
  nov: 11, november: 11, noviembre: 11, novembro: 11, novembre: 11, ноя: 11, ноябрь: 11, ноября: 11,
  dec: 12, december: 12, diciembre: 12, dezembro: 12, dezember: 12, décembre: 12, desember: 12, дек: 12, декабрь: 12, декабря: 12,
};

export function parseWeightGrams(text: string): number | null {
  const matches = [...text.matchAll(/(?<!\d)(\d{2,3}(?:[.,]\d{1,3})?)(?:\s*(?:kg|кг|公斤|キロ(?:グラム)?))?(?!\d)/giu)]
    .map((match) => Number(match[1]!.replace(',', '.')))
    .filter((value) => value >= 20 && value <= 500);
  const unique = [...new Set(matches)];
  if (unique.length !== 1) return null;
  return Math.round(unique[0]! * 1000);
}

function validDate(year: number, month: number, day: number, zone: string): string | null {
  const value = DateTime.fromObject({ year, month, day }, { zone });
  return value.isValid && value.year === year && value.month === month && value.day === day
    ? value.toISODate()
    : null;
}

export function parseLocalizedDate(text: string, zone: string): string | null {
  const normalized = text.trim().toLowerCase().replace(/[,]/g, ' ').replace(/\s+/g, ' ');
  const eastAsian = normalized.match(/\b(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/u);
  if (eastAsian) return validDate(Number(eastAsian[1]), Number(eastAsian[2]), Number(eastAsian[3]), zone);
  let match = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (match) return validDate(Number(match[1]), Number(match[2]), Number(match[3]), zone);

  match = normalized.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (match) return validDate(Number(match[3]), Number(match[2]), Number(match[1]), zone);

  match = normalized.match(/\b(\d{1,2})\.?\s+(?:de\s+)?([\p{L}]+)\.?\s+(?:de\s+)?(20\d{2})\b/iu);
  if (!match) return null;
  const month = MONTHS[match[2]!.replace(/\.$/, '')];
  return month ? validDate(Number(match[3]), month, Number(match[1]), zone) : null;
}
