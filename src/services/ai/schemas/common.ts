import {z} from 'zod';

export const MealTypeSchema = z.enum([
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
]);

export const IntensitySchema = z.enum(['light', 'moderate', 'vigorous']);

export const FoodUnitSchema = z.enum([
  'g',
  'kg',
  'ml',
  'piece',
  'slice',
  'scoop',
  'cup',
  'tbsp',
  'tsp',
  'serving',
]);

export const ActivityLevelSchema = z.enum([
  'sedentary',
  'light',
  'moderate',
  'very_active',
]);
