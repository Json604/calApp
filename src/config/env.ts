import type {ProviderId} from '../types';
import {
  AI_FALLBACK_PROVIDER,
  AI_PRIMARY_PROVIDER,
  GROQ_TEXT_MODEL,
  GROQ_TRANSCRIPTION_MODEL,
  NVIDIA_BASE_URL,
  NVIDIA_TEXT_MODEL,
} from '@env';
import {
  DEFAULT_GROQ_TEXT_MODEL,
  DEFAULT_GROQ_TRANSCRIPTION_MODEL,
  DEFAULT_NVIDIA_BASE_URL,
  DEFAULT_NVIDIA_TEXT_MODEL,
  resolveGroqTextModel,
} from '../services/ai/models';

export {
  DEFAULT_GROQ_TEXT_MODEL,
  DEFAULT_GROQ_TRANSCRIPTION_MODEL,
  DEFAULT_NVIDIA_BASE_URL,
  DEFAULT_NVIDIA_TEXT_MODEL,
};

/**
 * API keys are not read from @env. react-native-dotenv inlines static
 * `GROQ_API_KEY` / `NVIDIA_API_KEY` imports into the release APK. Keys
 * are entered in Settings and stored on-device instead.
 */
function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

export interface AiEnvConfig {
  groqTextModel: string;
  groqTranscriptionModel: string;
  nvidiaBaseUrl: string;
  nvidiaTextModel: string;
  primaryProvider: ProviderId;
  fallbackProvider: ProviderId;
}

function asProvider(value: string, fallback: ProviderId): ProviderId {
  return value === 'groq' || value === 'nvidia' ? value : fallback;
}

export function loadAiEnvConfig(): AiEnvConfig {
  return {
    groqTextModel: resolveGroqTextModel(
      firstNonEmpty(
        GROQ_TEXT_MODEL,
        process.env.GROQ_TEXT_MODEL,
        DEFAULT_GROQ_TEXT_MODEL,
      ),
    ),
    groqTranscriptionModel: firstNonEmpty(
      GROQ_TRANSCRIPTION_MODEL,
      process.env.GROQ_TRANSCRIPTION_MODEL,
      DEFAULT_GROQ_TRANSCRIPTION_MODEL,
    ),
    nvidiaBaseUrl: firstNonEmpty(
      NVIDIA_BASE_URL,
      process.env.NVIDIA_BASE_URL,
      DEFAULT_NVIDIA_BASE_URL,
    ).replace(/\/$/, ''),
    nvidiaTextModel: firstNonEmpty(
      NVIDIA_TEXT_MODEL,
      process.env.NVIDIA_TEXT_MODEL,
      DEFAULT_NVIDIA_TEXT_MODEL,
    ),
    primaryProvider: asProvider(
      firstNonEmpty(AI_PRIMARY_PROVIDER, process.env.AI_PRIMARY_PROVIDER, 'groq'),
      'groq',
    ),
    fallbackProvider: asProvider(
      firstNonEmpty(
        AI_FALLBACK_PROVIDER,
        process.env.AI_FALLBACK_PROVIDER,
        'nvidia',
      ),
      'nvidia',
    ),
  };
}

export const aiEnv = loadAiEnvConfig();
