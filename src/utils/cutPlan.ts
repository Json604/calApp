import {KCAL_PER_KG_FAT} from '../constants/energy';
import type {DailyEnergyBreakdown, UserGoal, UserProfile} from '../types';
import {
  calorieFloorKcal,
  clampWeeklyLossKg,
  dailyDeficitFromWeeklyLoss,
} from './tdee';
import {roundCalories, roundTo} from './units';

export interface CutPlan {
  intakeKcal: number;
  estimatedBurnKcal: number;
  foodLogged: boolean;
  todayBalanceKcal: number | null;
  plannedWeeklyLossKg: number;
  plannedDailyDeficitKcal: number;
  plannedWeeklyDeficitKcal: number;
  eatTargetKcal: number;
  eatLessThanBurnKcal: number;
  remainingKg: number;
  weeksAtPlan: number | null;
  totalKcalToGoal: number;
  floorBound: boolean;
}

export function buildCutPlan(params: {
  profile: UserProfile;
  goal: UserGoal;
  energy: DailyEnergyBreakdown | null;
  remainingKg: number;
}): CutPlan {
  const weekly = clampWeeklyLossKg(params.goal.weeklyWeightLossTargetKg);
  const plannedDailyDeficitKcal = roundCalories(
    dailyDeficitFromWeeklyLoss(weekly),
  );
  const estimatedBurnKcal = params.energy?.estimatedDailyBurn ?? 0;
  const intakeKcal = params.energy?.caloriesConsumed ?? 0;
  const foodLogged = Boolean(params.energy?.foodLogged);
  const floor = calorieFloorKcal(params.profile.sex);
  const eatTargetKcal = Math.max(floor, params.goal.calorieTarget);
  const unconstrained = estimatedBurnKcal - plannedDailyDeficitKcal;
  const floorBound = unconstrained < floor && estimatedBurnKcal > 0;
  const remainingKg = Math.max(0, roundTo(params.remainingKg, 2));
  return {
    intakeKcal,
    estimatedBurnKcal,
    foodLogged,
    todayBalanceKcal: foodLogged && params.energy ? params.energy.balance : null,
    plannedWeeklyLossKg: weekly,
    plannedDailyDeficitKcal,
    plannedWeeklyDeficitKcal: plannedDailyDeficitKcal * 7,
    eatTargetKcal,
    eatLessThanBurnKcal: Math.max(0, estimatedBurnKcal - eatTargetKcal),
    remainingKg,
    weeksAtPlan:
      weekly > 0 && remainingKg > 0 ? roundTo(remainingKg / weekly, 0) : remainingKg === 0 ? 0 : null,
    totalKcalToGoal: roundCalories(remainingKg * KCAL_PER_KG_FAT),
    floorBound,
  };
}

export function loggedWeeklyDeficitKcal(
  days: DailyEnergyBreakdown[],
): number | null {
  const logged = days.filter(day => day.foodLogged);
  if (logged.length === 0) {
    return null;
  }
  const sum = logged.reduce((acc, day) => acc + day.balance, 0);
  return roundCalories(-sum);
}
