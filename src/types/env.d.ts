declare const process: {
  env: Record<string, string | undefined>;
};

declare module '@env' {
  export const GROQ_API_KEY: string | undefined;
  export const GROQ_TEXT_MODEL: string | undefined;
  export const GROQ_TRANSCRIPTION_MODEL: string | undefined;
  export const NVIDIA_API_KEY: string | undefined;
  export const NVIDIA_BASE_URL: string | undefined;
  export const NVIDIA_TEXT_MODEL: string | undefined;
  export const AI_PRIMARY_PROVIDER: string | undefined;
  export const AI_FALLBACK_PROVIDER: string | undefined;
}
