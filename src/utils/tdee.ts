import {ACTIVITY_MULTIPLIERS, DEFAULT_PROTEIN_G_PER_KG} from '../constants/energy';
import type {ActivityLevel, Sex} from '../types';
import {calculateBmr} from './bmr';
import {roundCalories, roundTo} from './units';

export function activityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[level];
}

/**
 * Base daily expenditure from non-exercise movement only.
 * Exercise calories are added separately by the energy model.
 */
export function calculateBaseDailyExpenditure(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
}): {bmr: number; multiplier: number; baseDailyExpenditure: number; dailyMovement: number} {
  const bmr = calculateBmr(params);
  const multiplier = activityMultiplier(params.activityLevel);
  const baseDailyExpenditure = bmr * multiplier;
  return {
    bmr,
    multiplier,
    baseDailyExpenditure,
    dailyMovement: baseDailyExpenditure - bmr,
  };
}

export function dailyDeficitFromWeeklyLoss(weeklyKg: number): number {
  return (weeklyKg * 7700) / 7;
}

export function suggestProteinTargetG(weightKg: number): number {
  return roundTo(weightKg * DEFAULT_PROTEIN_G_PER_KG, 0);
}

export function suggestCalorieTarget(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  weeklyWeightLossTargetKg: number;
}): number {
  const {baseDailyExpenditure} = calculateBaseDailyExpenditure(params);
  const deficit = dailyDeficitFromWeeklyLoss(params.weeklyWeightLossTargetKg);
  return Math.max(1200, roundCalories(baseDailyExpenditure - deficit));
}
