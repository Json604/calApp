import {COMMON_EXERCISES, EXERCISE_ALIASES} from '../../constants/exercises';

export function canonicalExerciseName(name: string): string {
  const key = name.trim().toLowerCase();
  if (EXERCISE_ALIASES[key]) {
    return EXERCISE_ALIASES[key];
  }
  const found = COMMON_EXERCISES.find(item => item.toLowerCase() === key);
  return found ?? titleCase(name);
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function uniqueExerciseNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const canonical = canonicalExerciseName(name);
    const key = canonical.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(canonical);
    }
  }
  return result;
}
