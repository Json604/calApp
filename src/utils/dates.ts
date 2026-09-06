import {addDays, format, parseISO, startOfDay, subDays} from 'date-fns';

export function todayKey(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

export function toDayKey(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === 'string' ? parseISO(isoOrDate) : isoOrDate;
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(isoOrKey: string, now: Date = new Date()): string {
  const date = parseISO(isoOrKey.length > 10 ? isoOrKey : `${isoOrKey}T00:00:00`);
  if (format(date, 'yyyy-MM-dd') === todayKey(now)) {
    return format(date, 'EEEE, d MMMM');
  }
  return format(date, 'EEE d MMM');
}

export function dayRangeKeys(end: Date, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(format(subDays(startOfDay(end), i), 'yyyy-MM-dd'));
  }
  return keys;
}

export function yesterdayKey(now: Date = new Date()): string {
  return format(subDays(now, 1), 'yyyy-MM-dd');
}

export function addDaysKey(key: string, amount: number): string {
  return format(addDays(parseISO(`${key}T00:00:00`), amount), 'yyyy-MM-dd');
}
