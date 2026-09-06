import {calculateBmr} from '../../src/utils/bmr';
import {
  calculateDailyEnergy,
  sumFoodMacros,
} from '../../src/utils/energyBalance';
import {estimateCaloriesFromMet} from '../../src/utils/met';
import {
  calculateBaseDailyExpenditure,
  dailyDeficitFromWeeklyLoss,
  suggestCalorieTarget,
  suggestProteinTargetG,
} from '../../src/utils/tdee';
import type {FoodEntry, UserGoal, UserProfile} from '../../src/types';

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
  calorieTarget: 2100,
  proteinTargetG: 150,
};

const body = {
  weightKg: profile.currentWeightKg,
  heightCm: profile.heightCm,
  age: profile.age,
  sex: profile.sex,
  activityLevel: profile.activityLevel,
};

describe('base expenditure', () => {
  it('is BMR times the non-exercise multiplier', () => {
    const result = calculateBaseDailyExpenditure(body);
    const bmr = calculateBmr(body);
    expect(result.bmr).toBe(bmr);
    expect(result.multiplier).toBe(1.325);
    expect(result.baseDailyExpenditure).toBeCloseTo(bmr * 1.325);
    expect(result.dailyMovement).toBeCloseTo(result.baseDailyExpenditure - bmr);
  });
});

describe('daily energy balance', () => {
  it('does not treat food minus workout as the deficit', () => {
    const foods: FoodEntry[] = [
      food({calories: 1930, protein: 140, carbs: 180, fat: 60}),
    ];
    const energy = calculateDailyEnergy({
      date: '2026-09-06',
      profile,
      goal,
      foods,
      workouts: [
        {
          id: 'w1',
          startedAt: '2026-09-06T10:00:00.000Z',
          endedAt: '2026-09-06T11:00:00.000Z',
          name: 'Push',
          exercises: [],
          intensity: 'moderate',
          estimatedCalories: 280,
          source: 'manual',
        },
      ],
      activities: [],
    });

    const naive = 1930 - 280;
    expect(energy.estimatedDailyBurn).toBe(
      energy.baseDailyExpenditure + energy.exerciseCalories,
    );
    expect(energy.balance).toBe(energy.caloriesConsumed - energy.estimatedDailyBurn);
    expect(energy.balance).not.toBe(naive);
    expect(energy.isDeficit).toBe(true);
  });
});

describe('targets', () => {
  it('maps 0.5 kg/week to about 550 kcal/day', () => {
    expect(Math.round(dailyDeficitFromWeeklyLoss(0.5))).toBe(550);
  });

  it('defaults protein near 2.0 g/kg', () => {
    expect(suggestProteinTargetG(74.8)).toBe(150);
  });

  it('sets calorie target from base expenditure minus planned deficit', () => {
    const target = suggestCalorieTarget({
      ...body,
      weeklyWeightLossTargetKg: 0.5,
    });
    const {baseDailyExpenditure} = calculateBaseDailyExpenditure(body);
    expect(target).toBe(Math.round(baseDailyExpenditure - 550));
  });
});

describe('MET calories', () => {
  it('uses MET × kg × hours', () => {
    expect(
      estimateCaloriesFromMet({
        met: 8,
        bodyWeightKg: 75,
        durationMinutes: 55,
      }),
    ).toBe(550);
  });
});

describe('macros', () => {
  it('sums food entries', () => {
    expect(
      sumFoodMacros([
        food({calories: 210, protein: 18, carbs: 1, fat: 15}),
        food({calories: 190, protein: 8, carbs: 36, fat: 2}),
      ]),
    ).toEqual({calories: 400, protein: 26, carbs: 37, fat: 17});
  });
});

function food(partial: Partial<FoodEntry>): FoodEntry {
  return {
    id: 'f',
    timestamp: '2026-09-06T08:00:00.000Z',
    name: 'x',
    quantity: 1,
    unit: 'piece',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealType: 'breakfast',
    source: 'manual',
    estimated: false,
    ...partial,
  };
}
