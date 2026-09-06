import {aiEnv} from '../../config/env';
import type {AppSettings} from '../../types';
import {trimSecret} from '../../utils/secrets';
import {GroqProvider} from './groq/GroqProvider';
import {NvidiaProvider} from './nvidia/NvidiaProvider';
import {ProviderManager} from './providerManager';
import type {GenerateStructuredOptions, GenerateStructuredOutcome} from './types';

type AiRuntimeSettings = Pick<
  AppSettings,
  | 'primaryProvider'
  | 'fallbackProvider'
  | 'groqTextModel'
  | 'nvidiaTextModel'
  | 'groqApiKey'
  | 'nvidiaApiKey'
>;

let settingsOverride: AiRuntimeSettings | null = null;

export function configureAiFromSettings(settings: AiRuntimeSettings): void {
  settingsOverride = settings;
}

function manager(): ProviderManager {
  const primary = settingsOverride?.primaryProvider ?? aiEnv.primaryProvider;
  const fallback = settingsOverride?.fallbackProvider ?? aiEnv.fallbackProvider;
  const groq = new GroqProvider(
    trimSecret(settingsOverride?.groqApiKey),
    settingsOverride?.groqTextModel ?? aiEnv.groqTextModel,
  );
  const nvidia = new NvidiaProvider(
    trimSecret(settingsOverride?.nvidiaApiKey),
    settingsOverride?.nvidiaTextModel ?? aiEnv.nvidiaTextModel,
    aiEnv.nvidiaBaseUrl,
  );
  return new ProviderManager([groq, nvidia], () => ({primary, fallback}));
}

export async function generateStructured<T>(
  options: GenerateStructuredOptions<T>,
): Promise<GenerateStructuredOutcome<T>> {
  return manager().generateStructured(options);
}

export {ProviderManager} from './providerManager';
export {GroqProvider} from './groq/GroqProvider';
export {NvidiaProvider} from './nvidia/NvidiaProvider';
export {getAiDebugState} from './debug';
