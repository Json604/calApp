import {maskSecret, trimSecret} from '../../src/utils/secrets';

describe('secrets', () => {
  it('trims and masks stored keys without showing the middle', () => {
    expect(trimSecret('  gsk_abc  ')).toBe('gsk_abc');
    expect(maskSecret('')).toBe('');
    expect(maskSecret('short')).toBe('••••');
    expect(maskSecret('gsk_abcdefghijklmnopqrstuvwxyz')).toBe('gsk_…wxyz');
  });
});
