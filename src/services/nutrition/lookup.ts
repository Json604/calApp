import type {DraftFoodItem, FoodUnit} from '../../types';
import {roundTo} from '../../utils/units';

const GRAMS_PER_UNIT: Record<FoodUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  piece: 50,
  slice: 30,
  scoop: 32,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  serving: 100,
};

function gramsFor(item: DraftFoodItem): number | null {
  if (item.quantity == null || item.quantity <= 0) {
    return null;
  }
  return item.quantity * (GRAMS_PER_UNIT[item.unit] ?? 100);
}

function scaleFrom100g(
  per100: {calories: number; protein: number; carbs: number; fat: number},
  grams: number,
) {
  const factor = grams / 100;
  return {
    calories: roundTo(per100.calories * factor, 0),
    protein: roundTo(per100.protein * factor, 1),
    carbs: roundTo(per100.carbs * factor, 1),
    fat: roundTo(per100.fat * factor, 1),
  };
}

/**
 * USDA FoodData Central, then Open Food Facts. Used only when local tables
 * and the model left calories empty. Failures are silent so logging still works.
 */
export async function lookupFoodNutrition(
  item: DraftFoodItem,
): Promise<DraftFoodItem> {
  if (item.calories != null && item.calories > 0) {
    return item;
  }
  const grams = gramsFor(item);
  if (!grams) {
    return item;
  }
  const per100 =
    (await searchUsda(item.name)) ?? (await searchOpenFoodFacts(item.name));
  if (!per100) {
    return {
      ...item,
      warning: item.warning ?? 'No calorie match — enter kcal if you know it.',
    };
  }
  const macros = scaleFrom100g(per100, grams);
  return {
    ...item,
    ...macros,
    estimated: true,
    warning: item.warning ?? 'Calories looked up from public nutrition data.',
  };
}

async function searchUsda(name: string): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} | null> {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&pageSize=5&dataType=Foundation,SR%20Legacy&query=${encodeURIComponent(name)}`;
  const payload = await fetchJson(url, 3500);
  const foods = (payload as {foods?: Array<{foodNutrients?: Array<{nutrientName?: string; value?: number; unitName?: string}>}>})
    ?.foods;
  if (!foods?.length) {
    return null;
  }
  for (const food of foods) {
    const nutrients = food.foodNutrients ?? [];
    const calories = nutrient(nutrients, ['Energy'], ['KCAL']);
    if (calories == null) {
      continue;
    }
    return {
      calories,
      protein: nutrient(nutrients, ['Protein'], ['G']) ?? 0,
      carbs: nutrient(nutrients, ['Carbohydrate'], ['G']) ?? 0,
      fat: nutrient(nutrients, ['Total lipid', 'Total fat'], ['G']) ?? 0,
    };
  }
  return null;
}

function nutrient(
  list: Array<{nutrientName?: string; value?: number; unitName?: string}>,
  nameParts: string[],
  units: string[],
): number | null {
  const hit = list.find(item => {
    const name = item.nutrientName ?? '';
    const unit = (item.unitName ?? '').toUpperCase();
    return (
      nameParts.some(part => name.toLowerCase().includes(part.toLowerCase())) &&
      units.includes(unit)
    );
  });
  return typeof hit?.value === 'number' ? hit.value : null;
}

async function searchOpenFoodFacts(name: string): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} | null> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=5`;
  const payload = await fetchJson(url, 3500);
  const products = (payload as {products?: Array<{nutriments?: Record<string, number>}>})
    ?.products;
  if (!products?.length) {
    return null;
  }
  for (const product of products) {
    const n = product.nutriments ?? {};
    const calories = n['energy-kcal_100g'] ?? n.energy_kcal_100g;
    if (typeof calories !== 'number' || calories <= 0) {
      continue;
    }
    return {
      calories,
      protein: n.proteins_100g ?? 0,
      carbs: n.carbohydrates_100g ?? 0,
      fat: n.fat_100g ?? 0,
    };
  }
  return null;
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
