import type {DailyEnergyBreakdown, FoodEntry, WeightEntry, Workout} from '../types';
import {addDaysKey, todayKey} from './dates';

function consecutiveDays(hasDay: (key: string) => boolean, from = todayKey()): number {
  let count = 0;
  let cursor = from;
  while (hasDay(cursor)) {
    count += 1;
    cursor = addDaysKey(cursor, -1);
  }
  return count;
}

export function foodLoggingStreak(foods: FoodEntry[], from = todayKey()): number {
  const days = new Set(foods.map(food => food.timestamp.slice(0, 10)));
  return consecutiveDays(key => days.has(key), from);
}

export function workoutStreak(workouts: Workout[], from = todayKey()): number {
  const days = new Set(
    workouts.filter(w => w.endedAt).map(workout => workout.startedAt.slice(0, 10)),
  );
  return consecutiveDays(key => days.has(key), from);
}

export function weightLoggingStreak(entries: WeightEntry[], from = todayKey()): number {
  const days = new Set(entries.map(entry => entry.date));
  return consecutiveDays(key => days.has(key), from);
}

export function proteinTargetStreak(
  days: DailyEnergyBreakdown[],
  from = todayKey(),
): number {
  const hit = new Set(
    days
      .filter(day => day.proteinG >= day.proteinTargetG && day.proteinTargetG > 0)
      .map(day => day.date),
  );
  return consecutiveDays(key => hit.has(key), from);
}

export function totalWorkouts(workouts: Workout[]): number {
  return workouts.filter(workout => workout.endedAt).length;
}
