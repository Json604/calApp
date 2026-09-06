import type {Sex} from '../types';

/**
 * Mifflin-St Jeor resting metabolic rate.
 * Male: 10w + 6.25h - 5a + 5
 * Female: 10w + 6.25h - 5a - 161
 */
export function calculateBmr(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
}): number {
  const {weightKg, heightCm, age, sex} = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}
