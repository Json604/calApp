import {ProviderManager} from '../../src/services/ai/providerManager';
import {ProviderFailure, type AIProvider} from '../../src/services/ai/types';
import {UniversalExtractionSchema} from '../../src/services/ai/schemas/intent';
import {FoodExtractionSchema} from '../../src/services/ai/schemas/food';

function mockProvider(
  id: 'groq' | 'nvidia',
  impl: AIProvider['generateStructured'],
  configured = true,
): AIProvider {
  return {
    id,
    isConfigured: () => configured,
    generateStructured: impl,
  };
}

const foodJson = {
  intent: 'food',
  confidence: 0.9,
  items: [
    {
      name: 'Egg',
      quantity: 3,
      unit: 'piece',
      estimatedCalories: 210,
      protein: 18,
      carbs: 1,
      fat: 15,
    },
  ],
  warnings: [],
};

describe('ProviderManager failover', () => {
  it('returns NVIDIA when Groq times out', async () => {
    const groq = mockProvider('groq', async () => {
      throw new ProviderFailure({
        kind: 'timeout',
        provider: 'groq',
        message: 'timeout',
      });
    });
    const nvidia = mockProvider('nvidia', async () => ({
      provider: 'nvidia',
      data: foodJson,
      rawText: JSON.stringify(foodJson),
      latencyMs: 40,
    }));
    const manager = new ProviderManager([groq, nvidia], () => ({
      primary: 'groq',
      fallback: 'nvidia',
    }));
    const result = await manager.generateStructured({
      systemPrompt: 'x',
      userText: 'three eggs',
      parse: value => FoodExtractionSchema.parse(value),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe('nvidia');
      expect(result.data.items[0].name).toBe('Egg');
    }
  });

  it('falls back when Groq returns malformed JSON after retry', async () => {
    const groq = mockProvider('groq', async () => ({
      provider: 'groq',
      data: {nope: true},
      rawText: '{}',
      latencyMs: 10,
    }));
    const nvidia = mockProvider('nvidia', async () => ({
      provider: 'nvidia',
      data: foodJson,
      rawText: JSON.stringify(foodJson),
      latencyMs: 12,
    }));
    const manager = new ProviderManager([groq, nvidia], () => ({
      primary: 'groq',
      fallback: 'nvidia',
    }));
    const result = await manager.generateStructured({
      systemPrompt: 'x',
      userText: 'three eggs',
      parse: value => FoodExtractionSchema.parse(value),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe('nvidia');
    }
  });

  it('returns a friendly error when both providers fail', async () => {
    const groq = mockProvider('groq', async () => {
      throw new ProviderFailure({
        kind: 'server',
        provider: 'groq',
        message: '500',
      });
    });
    const nvidia = mockProvider('nvidia', async () => {
      throw new ProviderFailure({
        kind: 'server',
        provider: 'nvidia',
        message: '500',
      });
    });
    const manager = new ProviderManager([groq, nvidia], () => ({
      primary: 'groq',
      fallback: 'nvidia',
    }));
    const result = await manager.generateStructured({
      systemPrompt: 'x',
      userText: 'three eggs',
      parse: value => FoodExtractionSchema.parse(value),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/manually/i);
    }
  });

  it('does not fallback for invalid user input', async () => {
    let nvidiaCalled = false;
    const groq = mockProvider('groq', async () => {
      throw new ProviderFailure({
        kind: 'invalid_user_input',
        provider: 'groq',
        message: 'No speech detected',
        retryable: false,
      });
    });
    const nvidia = mockProvider('nvidia', async () => {
      nvidiaCalled = true;
      return {
        provider: 'nvidia',
        data: foodJson,
        rawText: '',
        latencyMs: 1,
      };
    });
    const manager = new ProviderManager([groq, nvidia], () => ({
      primary: 'groq',
      fallback: 'nvidia',
    }));
    const result = await manager.generateStructured({
      systemPrompt: 'x',
      userText: '',
      parse: value => FoodExtractionSchema.parse(value),
    });
    expect(result.ok).toBe(false);
    expect(nvidiaCalled).toBe(false);
  });
});

describe('schema validation', () => {
  it('rejects food payloads without items', () => {
    expect(() =>
      FoodExtractionSchema.parse({intent: 'food', items: []}),
    ).toThrow();
  });

  it('accepts a universal food payload', () => {
    const parsed = UniversalExtractionSchema.parse(foodJson);
    expect(parsed.intent).toBe('food');
  });
});
