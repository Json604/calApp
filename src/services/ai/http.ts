import {ProviderFailure, type ProviderId} from './types';

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {...init, signal: controller.signal});
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function classifyHttpFailure(
  provider: ProviderId,
  error: unknown,
  status?: number,
): ProviderFailure {
  if (error instanceof ProviderFailure) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'timeout' || message.toLowerCase().includes('timeout')) {
    return new ProviderFailure({
      kind: 'timeout',
      provider,
      message: 'Request timed out',
    });
  }
  if (status === 401 || status === 403) {
    return new ProviderFailure({
      kind: 'not_configured',
      provider,
      status,
      message: 'Provider authentication failed',
      retryable: false,
    });
  }
  if (status === 404 || status === 400) {
    const unsupported =
      /model|not found|does not exist|unsupported|decommissioned|retired/i.test(
        message,
      );
    return new ProviderFailure({
      kind: unsupported ? 'unsupported_model' : 'malformed',
      provider,
      status,
      message,
    });
  }
  if (status === 429) {
    return new ProviderFailure({
      kind: 'rate_limit',
      provider,
      status,
      message: 'Rate limited',
    });
  }
  if (status && status >= 500) {
    return new ProviderFailure({
      kind: 'server',
      provider,
      status,
      message: 'Provider server error',
    });
  }
  return new ProviderFailure({
    kind: 'transient',
    provider,
    status,
    message: message || 'Network error',
  });
}

export function extractChatText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Empty provider payload');
  }
  const record = payload as {
    choices?: Array<{
      message?: {
        content?: string | Array<{text?: string; type?: string}>;
        reasoning?: string;
      };
    }>;
    error?: {message?: string};
  };
  if (record.error?.message) {
    throw new Error(record.error.message);
  }
  const content = record.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.trim()) {
    return content;
  }
  if (Array.isArray(content)) {
    const joined = content.map(part => part.text ?? '').join('');
    if (joined.trim()) {
      return joined;
    }
  }
  const reasoning = record.choices?.[0]?.message?.reasoning;
  if (typeof reasoning === 'string' && reasoning.trim()) {
    return reasoning;
  }
  throw new Error('Provider returned no text');
}
