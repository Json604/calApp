import type {ProviderId} from '../types';
import {
  AI_FALLBACK_PROVIDER,
  AI_PRIMARY_PROVIDER,
  GROQ_API_KEY,
  GROQ_TEXT_MODEL,
  GROQ_TRANSCRIPTION_MODEL,
  NVIDIA_API_KEY,
  NVIDIA_BASE_URL,
  NVIDIA_TEXT_MODEL,
} from '@env';

/**
 * Babel's react-native-dotenv plugin only inlines *static* reads:
 * `import {GROQ_API_KEY} from '@env'` and `process.env.GROQ_API_KEY`.
 * Dynamic `process.env[key]` / `require('@env')` stay empty in release APKs,
 * which made voice logging report "AI parsing is temporarily unavailable".
 */
function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

export const DEFAULT_GROQ_TEXT_MODEL = 'llama-3.1-8b-instant';
export const DEFAULT_GROQ_TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';
export const DEFAULT_NVIDIA_TEXT_MODEL = 'meta/llama-3.1-8b-instruct';
export const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export interface AiEnvConfig {
  groqApiKey: string;
  groqTextModel: string;
  groqTranscriptionModel: string;
  nvidiaApiKey: string;
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
    groqApiKey: firstNonEmpty(GROQ_API_KEY, process.env.GROQ_API_KEY),
    groqTextModel: firstNonEmpty(
      GROQ_TEXT_MODEL,
      process.env.GROQ_TEXT_MODEL,
      DEFAULT_GROQ_TEXT_MODEL,
    ),
    groqTranscriptionModel: firstNonEmpty(
      GROQ_TRANSCRIPTION_MODEL,
      process.env.GROQ_TRANSCRIPTION_MODEL,
      DEFAULT_GROQ_TRANSCRIPTION_MODEL,
    ),
    nvidiaApiKey: firstNonEmpty(NVIDIA_API_KEY, process.env.NVIDIA_API_KEY),
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
