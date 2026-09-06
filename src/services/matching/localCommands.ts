import type {FoodEntry, MealType, ParsedUserInput, Workout} from '../../types';
import {toDayKey, yesterdayKey} from '../../utils/dates';
import {matchSavedFood} from './foodMatch';
import type {SavedFood} from '../../types';

export interface LocalCommandContext {
  foods: FoodEntry[];
  workouts: Workout[];
  savedFoods: SavedFood[];
}

export function tryLocalCommand(
  text: string,
  context: LocalCommandContext,
): ParsedUserInput | null {
  const input = text.trim().toLowerCase();

  if (
    /same breakfast as yesterday|copy yesterday'?s breakfast/.test(input)
  ) {
    return copyMeal(context, 'breakfast');
  }
  if (/same lunch as yesterday|copy yesterday'?s lunch/.test(input)) {
    return copyMeal(context, 'lunch');
  }
  if (/same dinner as yesterday|copy yesterday'?s dinner/.test(input)) {
    return copyMeal(context, 'dinner');
  }
  if (/copy yesterday'?s food|repeat yesterday'?s food/.test(input)) {
    return copyMeal(context);
  }

  const usual = input.match(/add (?:my )?usual (.+)/);
  if (usual) {
    const hit = matchSavedFood(usual[1], context.savedFoods, 0.6);
    if (hit) {
      return {
        intent: 'food',
        confidence: hit.score,
        transcript: text,
        warnings: [],
        data: {
          items: [
            {
              name: hit.food.name,
              quantity: hit.food.defaultQuantity,
              unit: hit.food.unit,
              calories: hit.food.calories,
              protein: hit.food.protein,
              carbs: hit.food.carbs,
              fat: hit.food.fat,
              confidence: hit.score,
              estimated: false,
              savedFoodId: hit.food.id,
            },
          ],
        },
      };
    }
  }

  const workoutMatch = input.match(/repeat (?:my )?(?:last )?(.+?) workout/);
  if (workoutMatch) {
    const needle = workoutMatch[1].trim();
    const found = [...context.workouts]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .find(workout => workout.name.toLowerCase().includes(needle));
    if (found) {
      return {
        intent: 'workout',
        confidence: 0.9,
        transcript: text,
        warnings: ['Copied from a previous workout — confirm before saving.'],
        data: {
          name: found.name,
          intensity: found.intensity,
          exercises: found.exercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets.map(set => ({
              weightKg: set.weightKg,
              reps: set.reps,
            })),
          })),
        },
      };
    }
  }

  return null;
}

function copyMeal(
  context: LocalCommandContext,
  mealType?: MealType,
): ParsedUserInput | null {
  const yesterday = yesterdayKey();
  const items = context.foods.filter(food => {
    if (toDayKey(food.timestamp) !== yesterday) {
      return false;
    }
    return mealType ? food.mealType === mealType : true;
  });
  if (items.length === 0) {
    return {
      intent: 'unknown',
      confidence: 0.4,
      transcript: '',
      warnings: ['No matching meal from yesterday.'],
      data: {reason: 'No matching meal from yesterday.'},
    };
  }
  return {
    intent: 'food',
    confidence: 0.95,
    transcript: '',
    warnings: ['Copied from yesterday — confirm before saving.'],
    data: {
      mealType,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        confidence: 1,
        estimated: false,
        savedFoodId: item.savedFoodId,
      })),
    },
  };
}
