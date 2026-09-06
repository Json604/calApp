import type {WeightEntry} from '../types';
import {roundTo} from './units';

function byDateAsc(a: WeightEntry, b: WeightEntry): number {
  return a.date.localeCompare(b.date);
}

export function latestWeight(entries: WeightEntry[]): WeightEntry | undefined {
  if (entries.length === 0) {
    return undefined;
  }
  return [...entries].sort(byDateAsc).at(-1);
}

export function averageWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) {
    return null;
  }
  const sum = entries.reduce((acc, entry) => acc + entry.weightKg, 0);
  return roundTo(sum / entries.length, 2);
}

export function entriesInDays(
  entries: WeightEntry[],
  endDateKey: string,
  days: number,
): WeightEntry[] {
  const start = offsetDateKey(endDateKey, -(days - 1));
  return entries.filter(entry => entry.date >= start && entry.date <= endDateKey);
}

function offsetDateKey(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function rollingWeightTrend(params: {
  entries: WeightEntry[];
  endDateKey: string;
}): {
  current: number | null;
  sevenDayAverage: number | null;
  previousSevenDayAverage: number | null;
  change14d: number | null;
  change30d: number | null;
  weeklyTrendKg: number | null;
} {
  const {entries, endDateKey} = params;
  const current = latestWeight(entries.filter(e => e.date <= endDateKey))?.weightKg ?? null;
  const last7 = entriesInDays(entries, endDateKey, 7);
  const prevEnd = offsetDateKey(endDateKey, -7);
  const prev7 = entriesInDays(entries, prevEnd, 7);
  const last14 = entriesInDays(entries, endDateKey, 14);
  const last30 = entriesInDays(entries, endDateKey, 30);
  const first14 = last14.length ? last14[0].weightKg : null;
  const last14w = last14.length ? last14[last14.length - 1].weightKg : null;
  const first30 = last30.length ? last30[0].weightKg : null;
  const last30w = last30.length ? last30[last30.length - 1].weightKg : null;
  const sevenDayAverage = averageWeight(last7);
  const previousSevenDayAverage = averageWeight(prev7);

  let weeklyTrendKg: number | null = null;
  if (sevenDayAverage !== null && previousSevenDayAverage !== null) {
    weeklyTrendKg = roundTo(sevenDayAverage - previousSevenDayAverage, 2);
  }

  return {
    current,
    sevenDayAverage,
    previousSevenDayAverage,
    change14d:
      first14 !== null && last14w !== null ? roundTo(last14w - first14, 2) : null,
    change30d:
      first30 !== null && last30w !== null ? roundTo(last30w - first30, 2) : null,
    weeklyTrendKg,
  };
}

export function goalProgress(params: {
  startKg: number;
  currentKg: number;
  goalKg: number;
}): {
  lostKg: number;
  remainingKg: number;
  percent: number;
} {
  const total = params.startKg - params.goalKg;
  const lostKg = roundTo(params.startKg - params.currentKg, 2);
  const remainingKg = roundTo(params.currentKg - params.goalKg, 2);
  if (total <= 0) {
    return {lostKg, remainingKg, percent: params.currentKg <= params.goalKg ? 100 : 0};
  }
  const percent = Math.max(0, Math.min(100, roundTo((lostKg / total) * 100, 0)));
  return {lostKg, remainingKg, percent};
}
