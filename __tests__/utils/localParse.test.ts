import {parseWorkoutShorthand, tryLocalWeight} from '../../src/services/matching/localParse';

describe('local workout shorthand', () => {
  it('parses bench 60 for 10, 65 for 8, 65 for 7', () => {
    const result = parseWorkoutShorthand(
      'Bench press 60 kilos for 10, 65 for 8, 65 for 7',
    );
    expect(result?.[0].name).toBe('Bench Press');
    expect(result?.[0].sets).toEqual([
      {weightKg: 60, reps: 10},
      {weightKg: 65, reps: 8},
      {weightKg: 65, reps: 7},
    ]);
  });
});

describe('local weight', () => {
  it('parses I weigh 74.8 kilos', () => {
    const result = tryLocalWeight('I weigh 74.8 kilos today.');
    expect(result?.intent).toBe('weight');
    if (result?.intent === 'weight') {
      expect(result.data.weightKg).toBeCloseTo(74.8);
    }
  });
});
