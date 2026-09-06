import type {
  DraftFoodItem,
  Intent,
  ParsedUserInput,
  SavedFood,
} from '../../../types';
import {canonicalExerciseName} from '../../matching/exerciseMatch';
import {enrichDraftItem} from '../../matching/foodMatch';
import {lookupFoodNutrition} from '../../nutrition/lookup';
import {tryLocalCommand, type LocalCommandContext} from '../../matching/localCommands';
import {
  parseFieldValue,
  parseWorkoutSetUtterance,
  tryLocalActivity,
  tryLocalFood,
  tryLocalWeight,
  tryLocalWorkout,
  type FieldKind,
} from '../../matching/localParse';
import {generateStructured} from '../index';
import {ActivityExtractionSchema} from '../schemas/activity';
import {FoodExtractionSchema} from '../schemas/food';
import {UniversalExtractionSchema} from '../schemas/intent';
import {WeightExtractionSchema} from '../schemas/weight';
import {WorkoutExtractionSchema} from '../schemas/workout';
import {
  ACTIVITY_JSON_HINT,
  BASE_PARSER_PROMPT,
  CORRECTION_PREFIX,
  FOOD_JSON_HINT,
  UNIVERSAL_JSON_HINT,
  WEIGHT_JSON_HINT,
  WORKOUT_JSON_HINT,
} from './prompts';
import {recordAiSuccess} from '../debug';
import type {ProviderId} from '../types';

export interface ParseContext {
  expectedIntent?: Intent;
  fieldKind?: FieldKind;
  savedFoods?: SavedFood[];
  recentFoods?: string[];
  recentExercises?: string[];
  localCommands?: LocalCommandContext;
  currentExerciseName?: string;
  previousSet?: {weightKg: number; reps: number};
  draft?: ParsedUserInput;
  activeWorkout?: boolean;
}

export async function parseUserInput(params: {
  text: string;
  context?: ParseContext;
}): Promise<ParsedUserInput> {
  const text = params.text.trim();
  const context = params.context ?? {};

  if (!text) {
    return unknown(text, 'Nothing to parse.');
  }

  if (context.fieldKind && context.fieldKind !== 'text') {
    const field = parseFieldValue(text, context.fieldKind);
    if (field && typeof field.value === 'number') {
      return fieldResult(text, context, field.value);
    }
  }

  if (context.activeWorkout && context.expectedIntent === 'workout') {
    const set = parseWorkoutSetUtterance(text, context.previousSet);
    if (set) {
      return {
        intent: 'workout',
        confidence: set.confidence,
        transcript: text,
        warnings:
          set.confidence < 0.8
            ? ['Interpreted from previous set — confirm weight and reps.']
            : [],
        data: {
          exercises: [
            {
              name: context.currentExerciseName ?? 'Current',
              sets: [{weightKg: set.weightKg, reps: set.reps}],
            },
          ],
        },
      };
    }
  }

  if (context.localCommands) {
    const command = tryLocalCommand(text, context.localCommands);
    if (command) {
      return {...command, transcript: text};
    }
  }

  if (!context.expectedIntent || context.expectedIntent === 'weight') {
    const weight = tryLocalWeight(text);
    if (weight && (!context.expectedIntent || context.expectedIntent === 'weight')) {
      return weight;
    }
  }

  if (!context.expectedIntent || context.expectedIntent === 'activity') {
    const activity = tryLocalActivity(text);
    if (activity && (!context.expectedIntent || context.expectedIntent === 'activity')) {
      return activity;
    }
  }

  if (!context.expectedIntent || context.expectedIntent === 'workout') {
    const workout = tryLocalWorkout(text);
    if (workout) {
      return workout;
    }
  }

  if (!context.expectedIntent || context.expectedIntent === 'food') {
    const food = tryLocalFood(text, context.savedFoods ?? []);
    if (food) {
      return food;
    }
  }

  return parseWithAi(text, context);
}

async function parseWithAi(
  text: string,
  context: ParseContext,
): Promise<ParsedUserInput> {
  const {systemPrompt, jsonHint, parse} = schemaFor(context);
  const userText = buildUserPayload(text, context);
  const outcome = await generateStructured({
    systemPrompt,
    userText,
    jsonHint,
    parse,
    temperature: 0.1,
    timeoutMs: 20000,
  });

  if (!outcome.ok) {
    return unknown(
      text,
      outcome.error,
    );
  }

  recordAiSuccess({
    provider: outcome.provider,
    latencyMs: outcome.latencyMs,
    transcript: text,
    intent: outcome.data.intent as Intent,
  });
  try {
    return await toParsed(
      text,
      outcome.data,
      outcome.provider,
      context.savedFoods ?? [],
    );
  } catch (error) {
    return unknown(
      text,
      error instanceof Error ? error.message : 'Could not read the parsed entry.',
    );
  }
}

function schemaFor(context: ParseContext) {
  if (context.expectedIntent === 'food') {
    return {
      systemPrompt: BASE_PARSER_PROMPT,
      jsonHint: FOOD_JSON_HINT,
      parse: (value: unknown) => FoodExtractionSchema.parse(value),
    };
  }
  if (context.expectedIntent === 'workout') {
    return {
      systemPrompt: BASE_PARSER_PROMPT,
      jsonHint: WORKOUT_JSON_HINT,
      parse: (value: unknown) => WorkoutExtractionSchema.parse(value),
    };
  }
  if (context.expectedIntent === 'activity') {
    return {
      systemPrompt: BASE_PARSER_PROMPT,
      jsonHint: ACTIVITY_JSON_HINT,
      parse: (value: unknown) => ActivityExtractionSchema.parse(value),
    };
  }
  if (context.expectedIntent === 'weight') {
    return {
      systemPrompt: BASE_PARSER_PROMPT,
      jsonHint: WEIGHT_JSON_HINT,
      parse: (value: unknown) => WeightExtractionSchema.parse(value),
    };
  }
  return {
    systemPrompt: BASE_PARSER_PROMPT,
    jsonHint: UNIVERSAL_JSON_HINT,
    parse: (value: unknown) => UniversalExtractionSchema.parse(value),
  };
}

function buildUserPayload(text: string, context: ParseContext): string {
  const lines = [`Utterance: ${text}`];
  if (context.draft) {
    lines.unshift(CORRECTION_PREFIX);
    lines.push(`Current draft JSON: ${JSON.stringify(context.draft)}`);
  }
  if (context.recentFoods && context.recentFoods.length > 0) {
    lines.push(`Recent foods: ${context.recentFoods.slice(0, 8).join(', ')}`);
  }
  if (context.savedFoods && context.savedFoods.length > 0) {
    lines.push(
      `Saved foods: ${context.savedFoods
        .slice(0, 8)
        .map(food => food.name)
        .join(', ')}`,
    );
  }
  if (context.recentExercises && context.recentExercises.length > 0) {
    lines.push(`Recent exercises: ${context.recentExercises.slice(0, 8).join(', ')}`);
  }
  if (context.currentExerciseName) {
    lines.push(`Current exercise: ${context.currentExerciseName}`);
  }
  if (context.expectedIntent) {
    lines.push(`Expected intent: ${context.expectedIntent}`);
  }
  return lines.join('\n');
}

async function toParsed(
  transcript: string,
  data: unknown,
  provider: ProviderId,
  savedFoods: SavedFood[],
): Promise<ParsedUserInput> {
  const parsed = UniversalExtractionSchema.parse(data);
  switch (parsed.intent) {
    case 'food': {
      const items: DraftFoodItem[] = await Promise.all(
        parsed.items.map(async item => {
          const draft = enrichDraftItem(
            {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              calories: item.estimatedCalories ?? null,
              protein: item.protein ?? null,
              carbs: item.carbs ?? null,
              fat: item.fat ?? null,
              confidence: item.confidence ?? parsed.confidence,
              estimated: true,
              warning:
                item.warning ??
                (item.quantity === null ? 'Serving size unclear' : undefined),
            },
            savedFoods,
          );
          if (draft.calories != null && draft.calories > 0) {
            return draft;
          }
          return lookupFoodNutrition(draft);
        }),
      );
      return {
        intent: 'food',
        confidence: parsed.confidence,
        transcript,
        warnings: [
          ...parsed.warnings,
          'AI estimate — verify if accuracy matters.',
        ],
        provider,
        data: {items, mealType: parsed.mealType},
      };
    }
    case 'workout':
      return {
        intent: 'workout',
        confidence: parsed.confidence,
        transcript,
        warnings: parsed.warnings,
        provider,
        data: {
          name: parsed.name,
          durationMinutes: parsed.durationMinutes,
          intensity: parsed.intensity,
          exercises: parsed.exercises.map(exercise => ({
            name: canonicalExerciseName(exercise.name),
            sets: exercise.sets,
            notes: exercise.notes,
          })),
        },
      };
    case 'activity':
      return {
        intent: 'activity',
        confidence: parsed.confidence,
        transcript,
        warnings: parsed.warnings,
        provider,
        data: {
          activityType: parsed.activity,
          durationMinutes: parsed.durationMinutes,
          intensity: parsed.intensity,
          suggestedMET: parsed.suggestedMET,
        },
      };
    case 'weight':
      return {
        intent: 'weight',
        confidence: parsed.confidence,
        transcript,
        warnings: parsed.warnings,
        provider,
        data: {weightKg: parsed.weightKg, date: parsed.date},
      };
    case 'goal_update':
      return {
        intent: 'goal_update',
        confidence: parsed.confidence,
        transcript,
        warnings: parsed.warnings,
        provider,
        data: {
          goalWeightKg: parsed.goalWeightKg,
          weeklyWeightLossTargetKg: parsed.weeklyWeightLossTargetKg,
          calorieTarget: parsed.calorieTarget,
          proteinTargetG: parsed.proteinTargetG,
        },
      };
    case 'profile_update':
      return {
        intent: 'profile_update',
        confidence: parsed.confidence,
        transcript,
        warnings: parsed.warnings,
        provider,
        data: {
          name: parsed.name,
          age: parsed.age,
          heightCm: parsed.heightCm,
          currentWeightKg: parsed.currentWeightKg,
          activityLevel: parsed.activityLevel,
        },
      };
    default:
      return unknown(transcript, parsed.reason, parsed.confidence, provider);
  }
}

function fieldResult(
  transcript: string,
  context: ParseContext,
  value: number,
): ParsedUserInput {
  if (context.expectedIntent === 'weight' || context.fieldKind === 'weight') {
    return {
      intent: 'weight',
      confidence: 0.95,
      transcript,
      warnings: [],
      data: {weightKg: value},
    };
  }
  return {
    intent: 'unknown',
    confidence: 0.95,
    transcript,
    warnings: [],
    data: {reason: String(value)},
  };
}

function unknown(
  transcript: string,
  reason: string,
  confidence = 0.2,
  provider?: ProviderId,
): ParsedUserInput {
  return {
    intent: 'unknown',
    confidence,
    transcript,
    warnings: [reason],
    provider,
    data: {reason},
  };
}
