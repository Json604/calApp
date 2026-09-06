import type {AiDebugState, ProviderId} from '../../types';

let state: AiDebugState = {};

export function recordAiSuccess(params: {
  provider: ProviderId;
  latencyMs: number;
  intent?: AiDebugState['lastIntent'];
  transcript?: string;
}): void {
  state = {
    lastProvider: params.provider,
    lastLatencyMs: params.latencyMs,
    lastError: undefined,
    lastIntent: params.intent,
    lastTranscript: params.transcript,
  };
}

export function recordAiError(message: string, provider?: ProviderId): void {
  state = {
    ...state,
    lastProvider: provider ?? state.lastProvider,
    lastError: message,
  };
}

export function getAiDebugState(): AiDebugState {
  return {...state};
}

export function resetAiDebugState(): void {
  state = {};
}
