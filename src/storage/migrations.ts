import {STORAGE_SCHEMA_VERSION} from '../constants/energy';
import type {KeyValueStore} from './client';
import {STORAGE_KEYS} from './keys';

export async function migrateStorage(store: KeyValueStore): Promise<number> {
  const raw = await store.getItem(STORAGE_KEYS.schemaVersion);
  const current = raw ? Number(raw) : 0;
  let version = Number.isFinite(current) ? current : 0;

  if (version < 1) {
    version = 1;
  }

  if (version !== STORAGE_SCHEMA_VERSION) {
    version = STORAGE_SCHEMA_VERSION;
  }

  await store.setItem(STORAGE_KEYS.schemaVersion, String(version));
  return version;
}
