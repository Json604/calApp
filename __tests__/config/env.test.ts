import {
  DEFAULT_GROQ_TEXT_MODEL,
  DEFAULT_NVIDIA_TEXT_MODEL,
  loadAiEnvConfig,
} from '../../src/config/env';

describe('loadAiEnvConfig', () => {
  it('always resolves text models and provider order', () => {
    const config = loadAiEnvConfig();
    expect(config.groqTextModel.length).toBeGreaterThan(0);
    expect(config.nvidiaTextModel.length).toBeGreaterThan(0);
    expect(config.groqTextModel).toEqual(expect.stringContaining('llama'));
    expect(config.nvidiaTextModel).toEqual(DEFAULT_NVIDIA_TEXT_MODEL);
    expect(['groq', 'nvidia']).toContain(config.primaryProvider);
    expect(['groq', 'nvidia']).toContain(config.fallbackProvider);
    expect(DEFAULT_GROQ_TEXT_MODEL).toContain('llama');
  });

  it('treats API keys as strings (empty in tests, inlined in release)', () => {
    const config = loadAiEnvConfig();
    expect(typeof config.groqApiKey).toBe('string');
    expect(typeof config.nvidiaApiKey).toBe('string');
  });
});
