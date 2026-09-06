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

  it('does not load API keys from the bundle env', () => {
    const config = loadAiEnvConfig() as unknown as Record<string, unknown>;
    expect(config).not.toHaveProperty('groqApiKey');
    expect(config).not.toHaveProperty('nvidiaApiKey');
  });
});
