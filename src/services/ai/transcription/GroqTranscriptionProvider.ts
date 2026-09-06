import {Platform} from 'react-native';
import {aiEnv} from '../../../config/env';
import {classifyHttpFailure, fetchWithTimeout} from '../http';
import {ProviderFailure} from '../types';
import type {TranscriptionProvider, Transcript} from './types';

export class GroqTranscriptionProvider implements TranscriptionProvider {
  readonly id = 'groq';

  constructor(
    private readonly apiKey = '',
    private readonly model = aiEnv.groqTranscriptionModel,
  ) {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0;
  }

  async transcribe(audioPath: string): Promise<Transcript> {
    if (!this.isConfigured()) {
      throw new ProviderFailure({
        kind: 'not_configured',
        provider: 'groq',
        message: 'Groq transcription is not configured',
        retryable: false,
      });
    }

    const uri = audioPath.startsWith('file://')
      ? audioPath
      : Platform.OS === 'android'
        ? `file://${audioPath}`
        : audioPath;

    const form = new FormData();
    form.append('file', {
      uri,
      type: 'audio/mp4',
      name: 'recording.m4a',
    } as unknown as Blob);
    form.append('model', this.model);
    form.append('language', 'en');
    form.append('response_format', 'json');

    let response: Response;
    try {
      response = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: form,
        },
        30000,
      );
    } catch (error) {
      throw classifyHttpFailure('groq', error);
    }

    const raw = await response.text();
    if (!response.ok) {
      throw classifyHttpFailure('groq', new Error(raw.slice(0, 240)), response.status);
    }

    let payload: {text?: string; duration?: number};
    try {
      payload = JSON.parse(raw) as {text?: string; duration?: number};
    } catch {
      throw new ProviderFailure({
        kind: 'malformed',
        provider: 'groq',
        message: 'Transcription response was not JSON',
      });
    }

    const text = payload.text?.trim() ?? '';
    if (!text) {
      throw new ProviderFailure({
        kind: 'invalid_user_input',
        provider: 'groq',
        message: 'No speech detected',
        retryable: false,
      });
    }

    return {text, durationSec: payload.duration, provider: this.id};
  }
}
