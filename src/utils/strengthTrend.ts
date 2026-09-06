import type {Exercise, Workout} from '../types';
import {roundTo} from './units';

export function epleyOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) {
    return weightKg;
  }
  return roundTo(weightKg * (1 + reps / 30), 1);
}

export function bestSet(exercise: Exercise): {weightKg: number; reps: number} | null {
  if (exercise.sets.length === 0) {
    return null;
  }
  return [...exercise.sets].sort((a, b) => {
    const a1 = epleyOneRepMax(a.weightKg, a.reps);
    const b1 = epleyOneRepMax(b.weightKg, b.reps);
    return b1 - a1;
  })[0];
}

export function sessionVolume(exercise: Exercise): number {
  return exercise.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);
}

export function lastPerformance(
  workouts: Workout[],
  exerciseName: string,
): Exercise | null {
  const needle = exerciseName.trim().toLowerCase();
  const chronological = [...workouts].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );
  for (const workout of chronological) {
    const found = workout.exercises.find(
      exercise => exercise.name.trim().toLowerCase() === needle,
    );
    if (found && found.sets.length > 0) {
      return found;
    }
  }
  return null;
}

export type StrengthDelta = 'up' | 'down' | 'same' | 'new';

export function compareBestSets(
  previous: {weightKg: number; reps: number} | null,
  current: {weightKg: number; reps: number} | null,
): StrengthDelta {
  if (!current) {
    return 'same';
  }
  if (!previous) {
    return 'new';
  }
  const prev = epleyOneRepMax(previous.weightKg, previous.reps);
  const curr = epleyOneRepMax(current.weightKg, current.reps);
  if (curr - prev > 0.4) {
    return 'up';
  }
  if (prev - curr > 0.4) {
    return 'down';
  }
  return 'same';
}

export function exerciseHistorySummary(workouts: Workout[], names: string[]) {
  return names.map(name => {
    const last = lastPerformance(workouts, name);
    const best = last ? bestSet(last) : null;
    return {
      name,
      last,
      best,
      estimated1rm: best ? epleyOneRepMax(best.weightKg, best.reps) : null,
      volume: last ? sessionVolume(last) : 0,
    };
  });
}
