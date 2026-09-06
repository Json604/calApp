import {
  enrichDraftItem,
  shouldPreferScaledDatabase,
} from '../../src/services/matching/foodMatch';
import type {DraftFoodItem} from '../../src/types';

function item(partial: Partial<DraftFoodItem>): DraftFoodItem {
  return {
    name: 'eggs',
    quantity: 3,
    unit: 'piece',
    calories: 70,
    protein: 6,
    carbs: 0.5,
    fat: 5,
    confidence: 0.8,
    estimated: true,
    ...partial,
  };
}

describe('food quantity scaling', () => {
  it('treats 70 kcal for 3 eggs as per-egg, not a total', () => {
    expect(
      shouldPreferScaledDatabase({
        reportedCalories: 70,
        quantity: 3,
        dbCalories: 70,
        dbPerQuantity: 1,
      }),
    ).toBe(true);
  });

  it('keeps 210 kcal for 3 eggs as a total', () => {
    expect(
      shouldPreferScaledDatabase({
        reportedCalories: 210,
        quantity: 3,
        dbCalories: 70,
        dbPerQuantity: 1,
      }),
    ).toBe(false);
  });

  it('scales three eggs to ~210 kcal from the local table', () => {
    const result = enrichDraftItem(item({calories: 70}), []);
    expect(result.name).toBe('Egg');
    expect(result.quantity).toBe(3);
    expect(result.calories).toBe(210);
    expect(result.protein).toBe(18);
  });

  it('scales 200 g chicken breast from 100 g macros', () => {
    const result = enrichDraftItem(
      item({
        name: 'chicken breast',
        quantity: 200,
        unit: 'g',
        calories: 165,
      }),
      [],
    );
    expect(result.calories).toBe(330);
  });
});
