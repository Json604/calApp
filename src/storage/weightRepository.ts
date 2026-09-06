import type {WeightEntry} from '../types';
import type {KeyValueStore} from './client';
import {readJson, writeJson} from './jsonStore';
import {STORAGE_KEYS} from './keys';

export function createWeightRepository(store: KeyValueStore) {
  return {
    async list(): Promise<WeightEntry[]> {
      return readJson<WeightEntry[]>(store, STORAGE_KEYS.weights, []);
    },
    async saveAll(items: WeightEntry[]): Promise<void> {
      await writeJson(store, STORAGE_KEYS.weights, items);
    },
    async upsert(entry: WeightEntry): Promise<WeightEntry[]> {
      const items = await this.list();
      const existing = items.findIndex(
        item => item.id === entry.id || item.date === entry.date,
      );
      const next =
        existing === -1
          ? [entry, ...items]
          : items.map((item, index) => (index === existing ? entry : item));
      next.sort((a, b) => b.date.localeCompare(a.date));
      await this.saveAll(next);
      return next;
    },
    async remove(id: string): Promise<WeightEntry[]> {
      const next = (await this.list()).filter(item => item.id !== id);
      await this.saveAll(next);
      return next;
    },
  };
}
