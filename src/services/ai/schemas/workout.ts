import {z} from 'zod';
import {IntensitySchema} from './common';

export const WorkoutSetSchema = z.object({
  weightKg: z.number().nonnegative(),
  reps: z.number().int().positive(),
});

export const WorkoutExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(WorkoutSetSchema).min(1),
  notes: z.string().optional(),
});

export const WorkoutExtractionSchema = z.object({
  intent: z.literal('workout'),
  confidence: z.number().min(0).max(1).default(0.7),
  name: z.string().optional(),
  exercises: z.array(WorkoutExerciseSchema).min(1),
  durationMinutes: z.number().positive().optional(),
  intensity: IntensitySchema.optional(),
  warnings: z.array(z.string()).default([]),
});

export const WorkoutSetOnlySchema = z.object({
  intent: z.literal('workout_set'),
  confidence: z.number().min(0).max(1).default(0.7),
  weightKg: z.number().nonnegative(),
  reps: z.number().int().positive(),
  warnings: z.array(z.string()).default([]),
});

export type WorkoutExtraction = z.infer<typeof WorkoutExtractionSchema>;
