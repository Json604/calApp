import {extractJsonObject} from '../../utils/json';
import {classifyHttpFailure, extractChatText, fetchWithTimeout} from './http';
import {
  ProviderFailure,
  type ProviderId,
  type StructuredRequest,
  type StructuredResult,
} from './types';

export async function openaiChatJson(params: {
  provider: ProviderId;
  url: string;
  apiKey: string;
  model: string;
  request: StructuredRequest;
  extraHeaders?: Record<string, string>;
}): Promise<StructuredResult<unknown>> {
  const {provider, url, apiKey, model, request} = params;
  if (!apiKey) {
    throw new ProviderFailure({
      kind: 'not_configured',
      provider,
      message: `${provider} is not configured`,
      retryable: false,
    });
  }

  const started = Date.now();
  const timeoutMs = request.timeoutMs ?? 15000;
  const body = {
    model,
    temperature: request.temperature ?? 0.1,
    max_tokens: 1200,
    messages: [
      {role: 'system', content: request.systemPrompt},
      {
        role: 'user',
        content: request.jsonHint
          ? `${request.userText}\n\n${request.jsonHint}`
          : request.userText,
      },
    ],
    response_format: {type: 'json_object'},
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(params.extraHeaders ?? {}),
        },
        body: JSON.stringify(body),
      },
      timeoutMs,
    );
  } catch (error) {
    throw classifyHttpFailure(provider, error);
  }

  const raw = await response.text();
  if (!response.ok) {
    throw classifyHttpFailure(provider, new Error(raw.slice(0, 300)), response.status);
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(raw);
  } catch {
    throw new ProviderFailure({
      kind: 'malformed',
      provider,
      message: 'Provider returned non-JSON HTTP body',
    });
  }

  let text: string;
  try {
    text = extractChatText(parsedPayload);
  } catch (error) {
    throw new ProviderFailure({
      kind: 'malformed',
      provider,
      message: error instanceof Error ? error.message : 'No text in response',
    });
  }

  try {
    const data = extractJsonObject(text);
    return {
      provider,
      data,
      rawText: text,
      latencyMs: Date.now() - started,
    };
  } catch {
    throw new ProviderFailure({
      kind: 'malformed',
      provider,
      message: 'Model output was not valid JSON',
    });
  }
}
