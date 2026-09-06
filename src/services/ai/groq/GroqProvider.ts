import {aiEnv} from '../../../config/env';
import {openaiChatJson} from '../openaiCompatible';
import type {AIProvider} from '../provider';
import type {StructuredRequest} from '../types';

export class GroqProvider implements AIProvider {
  readonly id = 'groq' as const;

  constructor(
    private readonly apiKey = '',
    private readonly model = aiEnv.groqTextModel,
  ) {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0;
  }

  generateStructured(request: StructuredRequest) {
    return openaiChatJson({
      provider: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: this.apiKey,
      model: this.model,
      request,
      extraBody: this.model.startsWith('openai/gpt-oss')
        ? {reasoning_effort: 'low'}
        : undefined,
    });
  }
}
