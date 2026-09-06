import {aiEnv} from '../../../config/env';
import type {AppSettings} from '../../../types';
import {trimSecret} from '../../../utils/secrets';
import {GroqTranscriptionProvider} from './GroqTranscriptionProvider';
import type {Transcript, TranscriptionProvider} from './types';

export class TranscriptionManager {
  constructor(private readonly providers: TranscriptionProvider[]) {}

  async transcribe(audioPath: string): Promise<Transcript> {
    const configured = this.providers.filter(provider => provider.isConfigured());
    if (configured.length === 0) {
      throw new Error(
        'Speech transcription is not configured. Add a Groq API key in Settings to enable voice.',
      );
    }
    return configured[0].transcribe(audioPath);
  }
}

export function createTranscriptionManager(settings?: AppSettings): TranscriptionManager {
  const groq = new GroqTranscriptionProvider(
    trimSecret(settings?.groqApiKey),
    settings?.transcriptionModel ?? aiEnv.groqTranscriptionModel,
  );
  return new TranscriptionManager([groq]);
}
