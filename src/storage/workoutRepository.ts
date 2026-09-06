import type {Workout} from '../types';
import type {KeyValueStore} from './client';
import {readJson, writeJson} from './jsonStore';
import {STORAGE_KEYS} from './keys';

export function createWorkoutRepository(store: KeyValueStore) {
  return {
    async list(): Promise<Workout[]> {
      return readJson<Workout[]>(store, STORAGE_KEYS.workouts, []);
    },
    async saveAll(workouts: Workout[]): Promise<void> {
      await writeJson(store, STORAGE_KEYS.workouts, workouts);
    },
    async upsert(workout: Workout): Promise<Workout[]> {
      const workouts = await this.list();
      const index = workouts.findIndex(item => item.id === workout.id);
      const next =
        index === -1
          ? [workout, ...workouts]
          : workouts.map(item => (item.id === workout.id ? workout : item));
      await this.saveAll(next);
      return next;
    },
    async remove(id: string): Promise<Workout[]> {
      const next = (await this.list()).filter(item => item.id !== id);
      await this.saveAll(next);
      return next;
    },
    async getActive(): Promise<Workout | null> {
      return readJson<Workout | null>(store, STORAGE_KEYS.activeWorkout, null);
    },
    async saveActive(workout: Workout | null): Promise<void> {
      if (!workout) {
        await store.removeItem(STORAGE_KEYS.activeWorkout);
        return;
      }
      await writeJson(store, STORAGE_KEYS.activeWorkout, workout);
    },
  };
}
