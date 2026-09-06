export const DEFAULT_GROQ_TEXT_MODEL = 'openai/gpt-oss-20b';
export const DEFAULT_GROQ_TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';
export const DEFAULT_NVIDIA_TEXT_MODEL = 'meta/llama-3.1-8b-instruct';
export const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/** Groq shut these down for free/developer tier on 2026-08-16. */
const RETIRED_GROQ_TEXT_MODELS: Record<string, string> = {
  'llama-3.1-8b-instant': DEFAULT_GROQ_TEXT_MODEL,
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama3-8b-8192': DEFAULT_GROQ_TEXT_MODEL,
  'llama3-70b-8192': 'openai/gpt-oss-120b',
};

export function resolveGroqTextModel(model: string | undefined): string {
  const trimmed = model?.trim() ?? '';
  if (!trimmed) {
    return DEFAULT_GROQ_TEXT_MODEL;
  }
  return RETIRED_GROQ_TEXT_MODELS[trimmed] ?? trimmed;
}
