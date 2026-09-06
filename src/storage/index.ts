import {asyncStore, type KeyValueStore} from './client';
import {createActivityRepository} from './activityRepository';
import {createFoodRepository} from './foodRepository';
import {migrateStorage} from './migrations';
import {createProfileRepository} from './profileRepository';
import {createSettingsRepository} from './settingsRepository';
import {createWeightRepository} from './weightRepository';
import {createWorkoutRepository} from './workoutRepository';

export function createRepositories(store: KeyValueStore = asyncStore) {
  return {
    store,
    profile: createProfileRepository(store),
    settings: createSettingsRepository(store),
    food: createFoodRepository(store),
    workout: createWorkoutRepository(store),
    activity: createActivityRepository(store),
    weight: createWeightRepository(store),
    migrate: () => migrateStorage(store),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
export {asyncStore, memoryStore} from './client';
export {STORAGE_KEYS} from './keys';
