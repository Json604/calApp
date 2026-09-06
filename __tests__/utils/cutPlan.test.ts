import {buildCutPlan, loggedWeeklyDeficitKcal} from '../../src/utils/cutPlan';
import type {DailyEnergyBreakdown, UserGoal, UserProfile} from '../../src/types';

const profile: UserProfile = {
  id: 'p1',
  age: 28,
  sex: 'male',
  heightCm: 178,
  currentWeightKg: 74.8,
  startingWeightKg: 77,
  activityLevel: 'light',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const goal: UserGoal = {
  goalWeightKg: 70,
  weeklyWeightLossTargetKg: 0.5,
  calorieTarget: 1737,
  proteinTargetG: 150,
};

const energy: DailyEnergyBreakdown = {
  date: '2026-09-06',
  bmr: 1726,
  dailyMovement: 561,
  baseDailyExpenditure: 2287,
  workoutCalories: 0,
  activityCalories: 0,
  exerciseCalories: 0,
  estimatedDailyBurn: 2287,
  caloriesConsumed: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  calorieTarget: 1737,
  proteinTargetG: 150,
  balance: -2287,
  isDeficit: true,
  foodLogged: false,
};

describe('cut plan', () => {
  it('states how much to eat below burn and kg remaining', () => {
    const plan = buildCutPlan({
      profile,
      goal,
      energy,
      remainingKg: 4.8,
    });
    expect(plan.plannedWeeklyLossKg).toBe(0.5);
    expect(plan.plannedDailyDeficitKcal).toBe(550);
    expect(plan.remainingKg).toBe(4.8);
    expect(plan.weeksAtPlan).toBe(10);
    expect(plan.eatLessThanBurnKcal).toBe(2287 - 1737);
    expect(plan.todayBalanceKcal).toBeNull();
  });

  it('does not treat unlogged days as a weekly deficit', () => {
    expect(loggedWeeklyDeficitKcal([energy])).toBeNull();
    expect(
      loggedWeeklyDeficitKcal([
        {...energy, foodLogged: true, caloriesConsumed: 1737, balance: -550},
      ]),
    ).toBe(550);
  });
});
