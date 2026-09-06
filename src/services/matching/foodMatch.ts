import {COMMON_FOODS, type CommonFood} from '../../constants/foods';
import type {DraftFoodItem, FoodUnit, SavedFood} from '../../types';
import {roundTo} from '../../utils/units';

export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(my|the|some|of|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreNames(query: string, candidate: string, aliases: string[]): number {
  const q = normalizeFoodName(query);
  const names = [candidate, ...aliases].map(normalizeFoodName);
  let best = 0;
  for (const name of names) {
    if (!name) {
      continue;
    }
    if (q === name) {
      best = Math.max(best, 1);
    } else if (name.includes(q) || q.includes(name)) {
      best = Math.max(best, 0.86);
    } else {
      const overlap = tokenOverlap(q, name);
      best = Math.max(best, overlap);
    }
  }
  return best;
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }
  let hit = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      hit += 1;
    }
  }
  return hit / Math.max(aTokens.size, bTokens.size);
}

export function scaleNutrition(
  per: {calories: number; protein: number; carbs: number; fat: number; perQuantity: number},
  quantity: number,
) {
  const factor = quantity / per.perQuantity;
  return {
    calories: roundTo(per.calories * factor, 0),
    protein: roundTo(per.protein * factor, 1),
    carbs: roundTo(per.carbs * factor, 1),
    fat: roundTo(per.fat * factor, 1),
  };
}

export function matchSavedFood(
  name: string,
  saved: SavedFood[],
  minScore = 0.72,
): {food: SavedFood; score: number} | null {
  let best: {food: SavedFood; score: number} | null = null;
  for (const food of saved) {
    const score = scoreNames(name, food.name, food.aliases);
    if (!best || score > best.score) {
      best = {food, score};
    }
  }
  return best && best.score >= minScore ? best : null;
}

export function matchCommonFood(
  name: string,
  minScore = 0.72,
): {food: CommonFood; score: number} | null {
  let best: {food: CommonFood; score: number} | null = null;
  for (const food of COMMON_FOODS) {
    const score = scoreNames(name, food.name, food.aliases);
    if (!best || score > best.score) {
      best = {food, score};
    }
  }
  return best && best.score >= minScore ? best : null;
}

export function enrichDraftItem(
  item: DraftFoodItem,
  saved: SavedFood[],
): DraftFoodItem {
  const savedHit = matchSavedFood(item.name, saved);
  if (savedHit) {
    const qty = item.quantity ?? savedHit.food.defaultQuantity;
    const macros = scaleNutrition(
      {
        calories: savedHit.food.calories,
        protein: savedHit.food.protein,
        carbs: savedHit.food.carbs,
        fat: savedHit.food.fat,
        perQuantity: savedHit.food.defaultQuantity,
      },
      qty,
    );
    return {
      ...item,
      name: savedHit.food.name,
      quantity: qty,
      unit: (item.unit || savedHit.food.unit) as FoodUnit,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      estimated: false,
      savedFoodId: savedHit.food.id,
      confidence: Math.max(item.confidence, savedHit.score),
      warning: undefined,
    };
  }

  const common = matchCommonFood(item.name);
  if (common) {
    const qty = item.quantity ?? common.food.perQuantity;
    const macros = scaleNutrition(
      {
        calories: common.food.calories,
        protein: common.food.protein,
        carbs: common.food.carbs,
        fat: common.food.fat,
        perQuantity: common.food.perQuantity,
      },
      qty,
    );
    const hasAiMacros = item.calories !== null && item.calories !== undefined;
    return {
      ...item,
      name: common.food.name,
      quantity: qty,
      unit: item.unit || common.food.unit,
      calories: hasAiMacros ? item.calories : macros.calories,
      protein: hasAiMacros ? item.protein : macros.protein,
      carbs: hasAiMacros ? item.carbs : macros.carbs,
      fat: hasAiMacros ? item.fat : macros.fat,
      estimated: true,
      confidence: Math.max(item.confidence, common.score * 0.9),
    };
  }
  return item;
}
