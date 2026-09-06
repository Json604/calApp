import {z} from 'zod';

export const WeightExtractionSchema = z.object({
  intent: z.literal('weight'),
  confidence: z.number().min(0).max(1).default(0.8),
  weightKg: z.number().positive(),
  date: z.string().optional(),
  warnings: z.array(z.string()).default([]),
});

export const GoalExtractionSchema = z.object({
  intent: z.literal('goal_update'),
  confidence: z.number().min(0).max(1).default(0.8),
  goalWeightKg: z.number().positive().optional(),
  weeklyWeightLossTargetKg: z.number().positive().optional(),
  calorieTarget: z.number().positive().optional(),
  proteinTargetG: z.number().positive().optional(),
  warnings: z.array(z.string()).default([]),
});

export const ProfileExtractionSchema = z.object({
  intent: z.literal('profile_update'),
  confidence: z.number().min(0).max(1).default(0.8),
  name: z.string().optional(),
  age: z.number().int().positive().optional(),
  heightCm: z.number().positive().optional(),
  currentWeightKg: z.number().positive().optional(),
  activityLevel: z
    .enum(['sedentary', 'light', 'moderate', 'very_active'])
    .optional(),
  warnings: z.array(z.string()).default([]),
});
