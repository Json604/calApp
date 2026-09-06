import {aiEnv} from '../../../config/env';
import {openaiChatJson} from '../openaiCompatible';
import type {AIProvider} from '../provider';
import type {StructuredRequest} from '../types';

export class NvidiaProvider implements AIProvider {
  readonly id = 'nvidia' as const;

  constructor(
    private readonly apiKey = '',
    private readonly model = aiEnv.nvidiaTextModel,
    private readonly baseUrl = aiEnv.nvidiaBaseUrl,
  ) {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0;
  }

  generateStructured(request: StructuredRequest) {
    const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
    return openaiChatJson({
      provider: 'nvidia',
      url,
      apiKey: this.apiKey,
      model: this.model,
      request,
    });
  }
}
