import type {ActivityLevel} from '../types';

/** Approximate kcal stored in 1 kg of body fat (Wishnofsky). Estimate only. */
export const KCAL_PER_KG_FAT = 7700;

/** NHS/CDC-style upper bound for a self-directed cut. */
export const MAX_WEEKLY_FAT_LOSS_KG = 1;
export const MIN_WEEKLY_FAT_LOSS_KG = 0.25;

export const WEEKLY_LOSS_OPTIONS = [0.25, 0.5, 0.75, 1] as const;

export const CALORIE_FLOOR_KCAL = {
  male: 1500,
  female: 1200,
} as const;

/**
 * Non-exercise activity multipliers.
 *
 * These describe everyday movement (NEAT / baseline living), NOT gym sessions.
 * Explicitly logged workouts and activities are added on top of
 * BMR × this multiplier. Traditional TDEE multipliers often already include
 * some exercise; using these lower, NEAT-focused values avoids double-counting
 * when logged exercise calories are added separately.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.325,
  moderate: 1.45,
  very_active: 1.575,
};

export const ACTIVITY_LEVEL_COPY: Record<
  ActivityLevel,
  {label: string; description: string}
> = {
  sedentary: {
    label: 'Sedentary',
    description: 'Desk work, little walking. Most of the day sitting.',
  },
  light: {
    label: 'Light',
    description: 'Some walking or standing. Short incidental movement.',
  },
  moderate: {
    label: 'Moderate',
    description: 'On your feet a lot. Regular walking throughout the day.',
  },
  very_active: {
    label: 'Very active',
    description: 'Physical job or high everyday movement, excluding workouts.',
  },
};

export const DEFAULT_PROTEIN_G_PER_KG = 2.0;
export const PROTEIN_RANGE_G_PER_KG = {min: 1.6, max: 2.2};

export const STORAGE_SCHEMA_VERSION = 1;
