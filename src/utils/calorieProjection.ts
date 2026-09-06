import {KCAL_PER_KG_FAT} from '../constants/energy';
import type {DailyEnergyBreakdown} from '../types';
import {roundTo} from './units';

export function averageBalance(days: DailyEnergyBreakdown[]): number | null {
  if (days.length === 0) {
    return null;
  }
  const sum = days.reduce((acc, day) => acc + day.balance, 0);
  return roundTo(sum / days.length, 0);
}

export function averageIntake(days: DailyEnergyBreakdown[]): number | null {
  if (days.length === 0) {
    return null;
  }
  return roundTo(days.reduce((acc, day) => acc + day.caloriesConsumed, 0) / days.length, 0);
}

export function averageBurn(days: DailyEnergyBreakdown[]): number | null {
  if (days.length === 0) {
    return null;
  }
  return roundTo(
    days.reduce((acc, day) => acc + day.estimatedDailyBurn, 0) / days.length,
    0,
  );
}

/**
 * Estimated weekly weight change from average daily energy balance.
 * Negative balance (deficit) → negative kg (loss).
 * Always an estimate: 7700 kcal ≈ 1 kg fat.
 */
export function estimatedWeeklyWeightChangeKg(averageDailyBalance: number): number {
  return roundTo((averageDailyBalance * 7) / KCAL_PER_KG_FAT, 2);
}

export function estimatedWeeksRemaining(params: {
  remainingKg: number;
  averageDailyBalance: number;
}): number | null {
  if (params.remainingKg <= 0) {
    return 0;
  }
  const weekly = estimatedWeeklyWeightChangeKg(params.averageDailyBalance);
  if (weekly >= 0) {
    return null;
  }
  return roundTo(params.remainingKg / Math.abs(weekly), 0);
}
