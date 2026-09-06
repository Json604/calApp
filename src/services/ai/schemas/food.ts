import {z} from 'zod';
import {FoodUnitSchema, MealTypeSchema} from './common';

export const FoodItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unit: FoodUnitSchema.default('serving'),
  estimatedCalories: z.number().nonnegative().nullable().optional(),
  protein: z.number().nonnegative().nullable().optional(),
  carbs: z.number().nonnegative().nullable().optional(),
  fat: z.number().nonnegative().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  warning: z.string().optional(),
});

export const FoodExtractionSchema = z.object({
  intent: z.literal('food'),
  confidence: z.number().min(0).max(1).default(0.7),
  items: z.array(FoodItemSchema).min(1),
  mealType: MealTypeSchema.optional(),
  warnings: z.array(z.string()).default([]),
});

export type FoodExtraction = z.infer<typeof FoodExtractionSchema>;
