import type {FoodEntry, SavedFood, SavedMeal} from '../types';
import type {KeyValueStore} from './client';
import {readJson, writeJson} from './jsonStore';
import {STORAGE_KEYS} from './keys';

export function createFoodRepository(store: KeyValueStore) {
  return {
    async listFoods(): Promise<FoodEntry[]> {
      return readJson<FoodEntry[]>(store, STORAGE_KEYS.foods, []);
    },
    async saveFoods(foods: FoodEntry[]): Promise<void> {
      await writeJson(store, STORAGE_KEYS.foods, foods);
    },
    async upsertFood(entry: FoodEntry): Promise<FoodEntry[]> {
      const foods = await this.listFoods();
      const index = foods.findIndex(item => item.id === entry.id);
      const next =
        index === -1
          ? [entry, ...foods]
          : foods.map(item => (item.id === entry.id ? entry : item));
      await this.saveFoods(next);
      return next;
    },
    async removeFood(id: string): Promise<FoodEntry[]> {
      const next = (await this.listFoods()).filter(item => item.id !== id);
      await this.saveFoods(next);
      return next;
    },
    async listSavedFoods(): Promise<SavedFood[]> {
      return readJson<SavedFood[]>(store, STORAGE_KEYS.savedFoods, []);
    },
    async saveSavedFoods(foods: SavedFood[]): Promise<void> {
      await writeJson(store, STORAGE_KEYS.savedFoods, foods);
    },
    async upsertSavedFood(food: SavedFood): Promise<SavedFood[]> {
      const foods = await this.listSavedFoods();
      const index = foods.findIndex(item => item.id === food.id);
      const next =
        index === -1
          ? [food, ...foods]
          : foods.map(item => (item.id === food.id ? food : item));
      await this.saveSavedFoods(next);
      return next;
    },
    async removeSavedFood(id: string): Promise<SavedFood[]> {
      const next = (await this.listSavedFoods()).filter(item => item.id !== id);
      await this.saveSavedFoods(next);
      return next;
    },
    async listSavedMeals(): Promise<SavedMeal[]> {
      return readJson<SavedMeal[]>(store, STORAGE_KEYS.savedMeals, []);
    },
    async saveSavedMeals(meals: SavedMeal[]): Promise<void> {
      await writeJson(store, STORAGE_KEYS.savedMeals, meals);
    },
  };
}
