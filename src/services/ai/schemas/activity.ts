import {z} from 'zod';
import {IntensitySchema} from './common';

export const ActivityExtractionSchema = z.object({
  intent: z.literal('activity'),
  confidence: z.number().min(0).max(1).default(0.7),
  activity: z.string().min(1),
  durationMinutes: z.number().positive(),
  intensity: IntensitySchema.default('moderate'),
  suggestedMET: z.number().positive().optional(),
  warnings: z.array(z.string()).default([]),
});

export type ActivityExtraction = z.infer<typeof ActivityExtractionSchema>;
