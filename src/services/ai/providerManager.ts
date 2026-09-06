import {recordAiError, recordAiSuccess} from './debug';
import {
  ProviderFailure,
  type AIProvider,
  type GenerateStructuredOptions,
  type GenerateStructuredOutcome,
  type ProviderId,
} from './types';

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export class ProviderManager {
  constructor(
    private readonly providers: AIProvider[],
    private readonly getOrder: () => {primary: ProviderId; fallback: ProviderId},
  ) {}

  async generateStructured<T>(
    options: GenerateStructuredOptions<T>,
  ): Promise<GenerateStructuredOutcome<T>> {
    const {primary, fallback} = this.getOrder();
    const ordered = [this.byId(primary), this.byId(fallback)].filter(
      (item, index, list): item is AIProvider => {
        if (!item) {
          return false;
        }
        return list.findIndex(other => other?.id === item.id) === index;
      },
    );

    if (ordered.length === 0) {
      const error = 'No AI provider is configured.';
      recordAiError(error);
      return {ok: false, error: userFacing(error), kind: 'not_configured'};
    }

    let lastFailure: ProviderFailure | undefined;

    for (const provider of ordered) {
      if (!provider.isConfigured()) {
        if (!lastFailure) {
          lastFailure = new ProviderFailure({
            kind: 'not_configured',
            provider: provider.id,
            message: `${provider.id} is not configured`,
            retryable: false,
          });
        }
        continue;
      }

      const result = await this.attempt(provider, options);
      if (result.ok) {
        recordAiSuccess({
          provider: result.provider,
          latencyMs: result.latencyMs,
        });
        return result;
      }
      lastFailure = result.failure;
      if (lastFailure.kind === 'invalid_user_input') {
        recordAiError(lastFailure.message, provider.id);
        return {
          ok: false,
          error: userFacing(lastFailure.message),
          kind: 'invalid_user_input',
          lastProvider: provider.id,
        };
      }
    }

    const message = lastFailure?.message ?? 'AI parsing is temporarily unavailable.';
    recordAiError(message, lastFailure?.provider);
    return {
      ok: false,
      error: userFacing(message, lastFailure?.kind),
      kind: lastFailure?.kind ?? 'all_failed',
      lastProvider: lastFailure?.provider,
    };
  }

  private byId(id: ProviderId): AIProvider | undefined {
    return this.providers.find(provider => provider.id === id);
  }

  private async attempt<T>(
    provider: AIProvider,
    options: GenerateStructuredOptions<T>,
  ): Promise<
    | {ok: true; provider: ProviderId; data: T; latencyMs: number}
    | {ok: false; failure: ProviderFailure}
  > {
    const run = async () => {
      const raw = await provider.generateStructured({
        systemPrompt: options.systemPrompt,
        userText: options.userText,
        jsonHint: options.jsonHint,
        temperature: options.temperature,
        timeoutMs: options.timeoutMs,
      });
      try {
        return {
          ok: true as const,
          provider: provider.id,
          data: options.parse(raw.data),
          latencyMs: raw.latencyMs,
        };
      } catch (error) {
        throw new ProviderFailure({
          kind: 'malformed',
          provider: provider.id,
          message: error instanceof Error ? error.message : 'Invalid structured output',
        });
      }
    };

    try {
      return await run();
    } catch (error) {
      const failure = asFailure(error, provider.id);
      if (failure.kind === 'invalid_user_input') {
        return {ok: false, failure};
      }
      if (failure.retryable) {
        try {
          await sleep(250);
          return await run();
        } catch (retryError) {
          return {ok: false, failure: asFailure(retryError, provider.id)};
        }
      }
      return {ok: false, failure};
    }
  }
}

function asFailure(error: unknown, provider: ProviderId): ProviderFailure {
  if (error instanceof ProviderFailure) {
    return error;
  }
  return new ProviderFailure({
    kind: 'transient',
    provider,
    message: error instanceof Error ? error.message : 'Unknown provider error',
  });
}

function userFacing(message: string, kind?: string): string {
  if (kind === 'not_configured' || /not configured/i.test(message)) {
    return 'AI is not configured. Add API keys in Settings.';
  }
  if (
    kind === 'unsupported_model' ||
    /decommissioned|does not exist|model_not_found/i.test(message)
  ) {
    return 'The Groq text model was retired. CutLog will switch to a current one — try voice again.';
  }
  if (kind === 'timeout') {
    return 'AI parsing timed out. Try a shorter log, or retry.';
  }
  return 'AI parsing is temporarily unavailable. You can still log this manually.';
}
