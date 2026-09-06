import type {KeyValueStore} from './client';

export async function readJson<T>(
  store: KeyValueStore,
  key: string,
  fallback: T,
): Promise<T> {
  const raw = await store.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(
  store: KeyValueStore,
  key: string,
  value: T,
): Promise<void> {
  await store.setItem(key, JSON.stringify(value));
}
