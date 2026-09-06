import {
  ACTIVITY_MULTIPLIERS,
  CALORIE_FLOOR_KCAL,
  DEFAULT_PROTEIN_G_PER_KG,
  KCAL_PER_KG_FAT,
  MAX_WEEKLY_FAT_LOSS_KG,
  MIN_WEEKLY_FAT_LOSS_KG,
} from '../constants/energy';
import type {ActivityLevel, Sex, UserGoal, UserProfile} from '../types';
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

export function clampWeeklyLossKg(weeklyKg: number): number {
  if (!Number.isFinite(weeklyKg) || weeklyKg < MIN_WEEKLY_FAT_LOSS_KG) {
    return MIN_WEEKLY_FAT_LOSS_KG;
  }
  return Math.min(MAX_WEEKLY_FAT_LOSS_KG, weeklyKg);
}

export function calorieFloorKcal(sex: Sex): number {
  return CALORIE_FLOOR_KCAL[sex];
}

export function dailyDeficitFromWeeklyLoss(weeklyKg: number): number {
  return (clampWeeklyLossKg(weeklyKg) * KCAL_PER_KG_FAT) / 7;
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
  const floor = calorieFloorKcal(params.sex);
  return Math.max(floor, roundCalories(baseDailyExpenditure - deficit));
}

export function applyCutTargets(profile: UserProfile, goal: UserGoal): UserGoal {
  const weekly = clampWeeklyLossKg(goal.weeklyWeightLossTargetKg);
  return {
    ...goal,
    weeklyWeightLossTargetKg: weekly,
    calorieTarget: suggestCalorieTarget({
      weightKg: profile.currentWeightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      weeklyWeightLossTargetKg: weekly,
    }),
  };
}
