import type {
  ActivityEntry,
  DailyEnergyBreakdown,
  FoodEntry,
  UserGoal,
  UserProfile,
  Workout,
} from '../types';
import {calculateBaseDailyExpenditure} from './tdee';
import {roundCalories, roundTo} from './units';

export function sumFoodMacros(foods: FoodEntry[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return foods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    {calories: 0, protein: 0, carbs: 0, fat: 0},
  );
}

export function calculateDailyEnergy(params: {
  date: string;
  profile: UserProfile;
  goal: UserGoal;
  foods: FoodEntry[];
  workouts: Workout[];
  activities: ActivityEntry[];
}): DailyEnergyBreakdown {
  const {date, profile, goal, foods, workouts, activities} = params;
  const {bmr, baseDailyExpenditure, dailyMovement} =
    calculateBaseDailyExpenditure({
      weightKg: profile.currentWeightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
    });

  const workoutCalories = workouts.reduce(
    (sum, workout) => sum + workout.estimatedCalories,
    0,
  );
  const activityCalories = activities.reduce(
    (sum, activity) => sum + activity.estimatedCalories,
    0,
  );
  const exerciseCalories = workoutCalories + activityCalories;
  const estimatedDailyBurn = baseDailyExpenditure + exerciseCalories;
  const macros = sumFoodMacros(foods);
  const balance = macros.calories - estimatedDailyBurn;

  return {
    date,
    bmr: roundCalories(bmr),
    dailyMovement: roundCalories(dailyMovement),
    baseDailyExpenditure: roundCalories(baseDailyExpenditure),
    workoutCalories: roundCalories(workoutCalories),
    activityCalories: roundCalories(activityCalories),
    exerciseCalories: roundCalories(exerciseCalories),
    estimatedDailyBurn: roundCalories(estimatedDailyBurn),
    caloriesConsumed: roundCalories(macros.calories),
    proteinG: roundTo(macros.protein, 0),
    carbsG: roundTo(macros.carbs, 0),
    fatG: roundTo(macros.fat, 0),
    calorieTarget: goal.calorieTarget,
    proteinTargetG: goal.proteinTargetG,
    balance: roundCalories(balance),
    isDeficit: balance < 0,
    foodLogged: foods.length > 0,
  };
}

export function deficitMagnitude(balance: number): number {
  return Math.abs(Math.round(balance));
}
