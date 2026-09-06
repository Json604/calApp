import {resolveGroqTextModel} from '../../src/services/ai/models';

describe('resolveGroqTextModel', () => {
  it('replaces the retired Llama 3.1 8B instant id', () => {
    expect(resolveGroqTextModel('llama-3.1-8b-instant')).toBe(
      'openai/gpt-oss-20b',
    );
  });

  it('keeps a current model id', () => {
    expect(resolveGroqTextModel('openai/gpt-oss-20b')).toBe(
      'openai/gpt-oss-20b',
    );
  });
});
