import {z} from 'zod';
import {ActivityExtractionSchema} from './activity';
import {FoodExtractionSchema} from './food';
import {GoalExtractionSchema, ProfileExtractionSchema, WeightExtractionSchema} from './weight';
import {WorkoutExtractionSchema} from './workout';

export const UnknownExtractionSchema = z.object({
  intent: z.literal('unknown'),
  confidence: z.number().min(0).max(1).default(0.4),
  reason: z.string().default('Could not determine intent'),
  warnings: z.array(z.string()).default([]),
});

export const UniversalExtractionSchema = z.discriminatedUnion('intent', [
  FoodExtractionSchema,
  WorkoutExtractionSchema,
  ActivityExtractionSchema,
  WeightExtractionSchema,
  GoalExtractionSchema,
  ProfileExtractionSchema,
  UnknownExtractionSchema,
]);

export type UniversalExtraction = z.infer<typeof UniversalExtractionSchema>;
