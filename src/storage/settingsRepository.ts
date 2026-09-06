import {
  DEFAULT_GROQ_TEXT_MODEL,
  DEFAULT_GROQ_TRANSCRIPTION_MODEL,
  DEFAULT_NVIDIA_TEXT_MODEL,
  aiEnv,
} from '../config/env';
import {resolveGroqTextModel} from '../services/ai/models';
import type {AppSettings} from '../types';
import type {KeyValueStore} from './client';
import {readJson, writeJson} from './jsonStore';
import {STORAGE_KEYS} from './keys';

export const defaultSettings = (): AppSettings => ({
  theme: 'system',
  weightUnit: 'kg',
  heightUnit: 'cm',
  primaryProvider: aiEnv.primaryProvider,
  fallbackProvider: aiEnv.fallbackProvider,
  groqTextModel: aiEnv.groqTextModel || DEFAULT_GROQ_TEXT_MODEL,
  nvidiaTextModel: aiEnv.nvidiaTextModel || DEFAULT_NVIDIA_TEXT_MODEL,
  transcriptionModel:
    aiEnv.groqTranscriptionModel || DEFAULT_GROQ_TRANSCRIPTION_MODEL,
  groqApiKey: '',
  nvidiaApiKey: '',
  showLastProvider: false,
  quickVoiceLogging: false,
});

export function createSettingsRepository(store: KeyValueStore) {
  return {
    async get(): Promise<AppSettings> {
      const stored = await readJson<Partial<AppSettings> | null>(
        store,
        STORAGE_KEYS.settings,
        null,
      );
      const merged = {...defaultSettings(), ...(stored ?? {})};
      const groqTextModel = resolveGroqTextModel(merged.groqTextModel);
      const next = {...merged, groqTextModel};
      if (stored && groqTextModel !== merged.groqTextModel) {
        await writeJson(store, STORAGE_KEYS.settings, next);
      }
      return next;
    },
    async save(settings: AppSettings): Promise<void> {
      await writeJson(store, STORAGE_KEYS.settings, settings);
    },
  };
}
