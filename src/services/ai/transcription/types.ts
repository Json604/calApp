export interface Transcript {
  text: string;
  durationSec?: number;
  provider: string;
}

export interface TranscriptionProvider {
  id: string;
  isConfigured(): boolean;
  transcribe(audioPath: string): Promise<Transcript>;
}
