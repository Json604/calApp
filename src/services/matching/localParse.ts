import {EXERCISE_ALIASES} from '../../constants/exercises';
import type {
  DraftFoodItem,
  DraftWorkoutExercise,
  FoodUnit,
  Intensity,
  ParsedUserInput,
} from '../../types';
import {todayKey} from '../../utils/dates';
import {extractFirstNumber, parseSpokenNumber} from '../../utils/spokenNumber';
import {lookupActivity} from '../../utils/met';
import {enrichDraftItem} from './foodMatch';
import type {SavedFood} from '../../types';
import {canonicalExerciseName} from './exerciseMatch';

export type FieldKind =
  | 'number'
  | 'weight'
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'duration'
  | 'reps'
  | 'quantity'
  | 'text';

export function parseFieldValue(
  text: string,
  kind: FieldKind,
): {value: number | string; confidence: number} | null {
  if (kind === 'text') {
    return {value: text.trim(), confidence: 1};
  }
  const number = parseSpokenNumber(text) ?? extractFirstNumber(text);
  if (number === null) {
    return null;
  }
  return {value: number, confidence: 0.95};
}

const UNIT_ALIASES: Record<string, FoodUnit> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  slice: 'slice',
  slices: 'slice',
  scoop: 'scoop',
  scoops: 'scoop',
  egg: 'piece',
  eggs: 'piece',
  piece: 'piece',
  pieces: 'piece',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tsp: 'tsp',
  serving: 'serving',
};

export function tryLocalWeight(text: string): ParsedUserInput | null {
  if (!/\b(weigh|weight|kg|kilos?)\b/i.test(text) && !/^\s*[\d.]+\s*(kg|kilos?)?\s*$/i.test(text)) {
    return null;
  }
  const number = parseSpokenNumber(text) ?? extractFirstNumber(text);
  if (!number || number < 30 || number > 300) {
    return null;
  }
  return {
    intent: 'weight',
    confidence: 0.9,
    transcript: text,
    warnings: [],
    data: {weightKg: number, date: todayKey()},
  };
}

export function tryLocalActivity(text: string): ParsedUserInput | null {
  const duration = extractDurationMinutes(text);
  if (!duration) {
    return null;
  }
  const activity = lookupActivity(text);
  if (!activity && !/\b(played|walked|ran|cycled|swam|rowed)\b/i.test(text)) {
    return null;
  }
  const intensity = inferIntensity(text);
  return {
    intent: 'activity',
    confidence: activity ? 0.86 : 0.6,
    transcript: text,
    warnings: [],
    data: {
      activityType: activity?.name ?? text,
      durationMinutes: duration,
      intensity,
      suggestedMET: activity?.met[intensity],
    },
  };
}

export function extractDurationMinutes(text: string): number | null {
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?)/i);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?)/i);
  const spokenMin = text.match(
    /\b(for\s+)?((?:an?\s+)?(?:hour|hours|minute|minutes|min|mins)|(?:thirty|forty|forty five|forty-five|fifty|fifty five|fifty-five|sixty|ten|fifteen|twenty|twenty five|twenty-five)\s+(?:minutes?|mins?))/i,
  );
  if (hourMatch && minMatch) {
    return Number(hourMatch[1]) * 60 + Number(minMatch[1]);
  }
  if (hourMatch) {
    return Number(hourMatch[1]) * 60;
  }
  if (minMatch) {
    return Number(minMatch[1]);
  }
  if (spokenMin) {
    return parseSpokenNumber(spokenMin[0]);
  }
  return null;
}

function inferIntensity(text: string): Intensity {
  if (/\b(hard|pretty hard|intense|vigorous|very hard)\b/i.test(text)) {
    return 'vigorous';
  }
  if (/\b(easy|light|easy pace|chill)\b/i.test(text)) {
    return 'light';
  }
  return 'moderate';
}

export function tryLocalWorkout(text: string): ParsedUserInput | null {
  const exercises = parseWorkoutShorthand(text);
  if (!exercises) {
    return null;
  }
  return {
    intent: 'workout',
    confidence: 0.84,
    transcript: text,
    warnings: [],
    data: {exercises},
  };
}

export function parseWorkoutShorthand(text: string): DraftWorkoutExercise[] | null {
  const normalized = text
    .replace(/kilos?/gi, 'kg')
    .replace(/pounds?/gi, 'kg')
    .replace(/then/gi, ',')
    .replace(/and then/gi, ',');

  const setMatches = [
    ...normalized.matchAll(
      /(\d+(?:\.\d+)?)\s*(?:kg)?\s*(?:x|×|for)\s*(\d+)/gi,
    ),
  ];

  if (setMatches.length === 0) {
    const repeated = normalized.match(
      /(\d+(?:\.\d+)?)\s*(?:kg)?[,\s]+(\d+)\s*reps?\s*(?:for\s*)?(\d+)\s*sets?/i,
    );
    if (repeated) {
      const weight = Number(repeated[1]);
      const reps = Number(repeated[2]);
      const sets = Number(repeated[3]);
      const name = extractExerciseName(normalized);
      return [
        {
          name,
          sets: Array.from({length: sets}, () => ({weightKg: weight, reps})),
        },
      ];
    }
    const another = normalized.match(/another\s+(\d+)/i);
    if (another) {
      return [
        {
          name: 'Current',
          sets: [{weightKg: 0, reps: Number(another[1])}],
        },
      ];
    }
    return null;
  }

  const name = extractExerciseName(normalized);
  const descendingReps = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:kg)?[^\d]+(\d+)\s*,\s*(\d+)\s*(?:and|,)\s*(\d+)\s*reps?/i,
  );
  if (descendingReps && setMatches.length === 1) {
    const weight = Number(descendingReps[1]);
    return [
      {
        name,
        sets: [
          {weightKg: weight, reps: Number(descendingReps[2])},
          {weightKg: weight, reps: Number(descendingReps[3])},
          {weightKg: weight, reps: Number(descendingReps[4])},
        ],
      },
    ];
  }

  return [
    {
      name,
      sets: setMatches.map(match => ({
        weightKg: Number(match[1]),
        reps: Number(match[2]),
      })),
    },
  ];
}

function extractExerciseName(text: string): string {
  const before = text.split(/\d/)[0] ?? '';
  const cleaned = before
    .replace(/\b(i|did|then|another|for|sets?|of)\b/gi, ' ')
    .trim();
  if (!cleaned) {
    return 'Exercise';
  }
  const alias = EXERCISE_ALIASES[cleaned.toLowerCase()];
  return alias ?? canonicalExerciseName(cleaned);
}

export function tryLocalFood(
  text: string,
  saved: SavedFood[],
): ParsedUserInput | null {
  const items = parseSimpleFoodList(text);
  if (!items || items.length === 0) {
    return null;
  }
  const enriched = items.map(item => enrichDraftItem(item, saved));
  const resolved = enriched.filter(
    item => item.calories !== null && item.quantity !== null,
  );
  if (resolved.length !== enriched.length) {
    return null;
  }
  return {
    intent: 'food',
    confidence: 0.8,
    transcript: text,
    warnings: ['Local estimate — verify if accuracy matters.'],
    data: {items: enriched},
  };
}

export function parseSimpleFoodList(text: string): DraftFoodItem[] | null {
  if (!/\b(ate|had|eaten|log|add)\b/i.test(text) && !/grams?|eggs?|slices?|scoop/i.test(text)) {
    return null;
  }
  const chunks = text
    .replace(/^(i\s+)?(ate|had|eaten|log|add)\s+/i, '')
    .replace(/\band\b/gi, ',')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (chunks.length === 0) {
    return null;
  }
  const items: DraftFoodItem[] = [];
  for (const chunk of chunks) {
    const parsed = parseFoodChunk(chunk);
    if (!parsed) {
      return null;
    }
    items.push(parsed);
  }
  return items;
}

function parseFoodChunk(chunk: string): DraftFoodItem | null {
  const qtyUnit = chunk.match(
    /^(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|couple|half)\s*(grams?|g|kg|slices?|scoops?|eggs?)?\s*(?:of\s+)?(.+)$/i,
  );
  if (!qtyUnit) {
    return null;
  }
  const rawQty = qtyUnit[1].toLowerCase();
  const quantity =
    rawQty === 'a' || rawQty === 'an' || rawQty === 'one'
      ? 1
      : rawQty === 'couple'
        ? 2
        : rawQty === 'half'
          ? 0.5
          : parseSpokenNumber(rawQty) ?? Number(rawQty);
  const unitToken = (qtyUnit[2] ?? '').toLowerCase();
  const name = qtyUnit[3].trim();
  if (!name) {
    return null;
  }
  let unit: FoodUnit = UNIT_ALIASES[unitToken] ?? 'serving';
  if (/eggs?/i.test(unitToken) || /eggs?$/i.test(name)) {
    unit = 'piece';
  }
  return {
    name: name.replace(/^eggs?\s+/i, '').replace(/\s+eggs?$/i, ' egg'),
    quantity: Number.isFinite(quantity) ? quantity : null,
    unit,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    confidence: 0.7,
    estimated: true,
  };
}

export function parseWorkoutSetUtterance(
  text: string,
  previous?: {weightKg: number; reps: number},
): {weightKg: number; reps: number; confidence: number} | null {
  const shorthand = text.match(
    /(\d+(?:\.\d+)?)\s*(?:kg|kilos?)?\s*(?:x|×|for)\s*(\d+)/i,
  );
  if (shorthand) {
    return {
      weightKg: Number(shorthand[1]),
      reps: Number(shorthand[2]),
      confidence: 0.93,
    };
  }
  const another = text.match(/another\s+(\d+)/i);
  if (another && previous) {
    return {
      weightKg: previous.weightKg,
      reps: Number(another[1]),
      confidence: 0.7,
    };
  }
  const repsOnly = parseSpokenNumber(text);
  if (repsOnly && previous && /\b(reps?)\b/i.test(text)) {
    return {weightKg: previous.weightKg, reps: repsOnly, confidence: 0.75};
  }
  return null;
}
