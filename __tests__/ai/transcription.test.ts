import {createTranscriptionManager} from '../../src/services/ai/transcription/TranscriptionManager';
import {defaultSettings} from '../../src/storage/settingsRepository';

describe('createTranscriptionManager', () => {
  it('refuses to transcribe until a Groq key is saved in settings', async () => {
    const manager = createTranscriptionManager(defaultSettings());
    await expect(manager.transcribe('/tmp/none.m4a')).rejects.toThrow(/Settings/);
  });
});
