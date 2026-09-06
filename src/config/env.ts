import type {ProviderId} from '../types';

function read(key: string, fallback = ''): string {
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.[key] : undefined;
  if (fromProcess && fromProcess.length > 0) {
    return fromProcess;
  }
  try {
    const env = require('@env') as Record<string, string | undefined>;
    const value = env?.[key];
    if (value && value.length > 0) {
      return value;
    }
  } catch {
    // @env is unavailable in unit tests or if .env is missing.
  }
  return fallback;
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
    groqApiKey: read('GROQ_API_KEY'),
    groqTextModel: read('GROQ_TEXT_MODEL', DEFAULT_GROQ_TEXT_MODEL),
    groqTranscriptionModel: read(
      'GROQ_TRANSCRIPTION_MODEL',
      DEFAULT_GROQ_TRANSCRIPTION_MODEL,
    ),
    nvidiaApiKey: read('NVIDIA_API_KEY'),
    nvidiaBaseUrl: read('NVIDIA_BASE_URL', DEFAULT_NVIDIA_BASE_URL).replace(
      /\/$/,
      '',
    ),
    nvidiaTextModel: read('NVIDIA_TEXT_MODEL', DEFAULT_NVIDIA_TEXT_MODEL),
    primaryProvider: asProvider(read('AI_PRIMARY_PROVIDER', 'groq'), 'groq'),
    fallbackProvider: asProvider(
      read('AI_FALLBACK_PROVIDER', 'nvidia'),
      'nvidia',
    ),
  };
}

export const aiEnv = loadAiEnvConfig();
