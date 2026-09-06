import type {ActivityEntry} from '../types';
import type {KeyValueStore} from './client';
import {readJson, writeJson} from './jsonStore';
import {STORAGE_KEYS} from './keys';

export function createActivityRepository(store: KeyValueStore) {
  return {
    async list(): Promise<ActivityEntry[]> {
      return readJson<ActivityEntry[]>(store, STORAGE_KEYS.activities, []);
    },
    async saveAll(items: ActivityEntry[]): Promise<void> {
      await writeJson(store, STORAGE_KEYS.activities, items);
    },
    async upsert(entry: ActivityEntry): Promise<ActivityEntry[]> {
      const items = await this.list();
      const index = items.findIndex(item => item.id === entry.id);
      const next =
        index === -1
          ? [entry, ...items]
          : items.map(item => (item.id === entry.id ? entry : item));
      await this.saveAll(next);
      return next;
    },
    async remove(id: string): Promise<ActivityEntry[]> {
      const next = (await this.list()).filter(item => item.id !== id);
      await this.saveAll(next);
      return next;
    },
  };
}
