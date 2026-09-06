import type {UserGoal, UserProfile} from '../types';
import type {KeyValueStore} from './client';
import {readJson, writeJson} from './jsonStore';
import {STORAGE_KEYS} from './keys';

export function createProfileRepository(store: KeyValueStore) {
  return {
    async getProfile(): Promise<UserProfile | null> {
      return readJson<UserProfile | null>(store, STORAGE_KEYS.profile, null);
    },
    async saveProfile(profile: UserProfile): Promise<void> {
      await writeJson(store, STORAGE_KEYS.profile, profile);
    },
    async getGoal(): Promise<UserGoal | null> {
      return readJson<UserGoal | null>(store, STORAGE_KEYS.goal, null);
    },
    async saveGoal(goal: UserGoal): Promise<void> {
      await writeJson(store, STORAGE_KEYS.goal, goal);
    },
  };
}
