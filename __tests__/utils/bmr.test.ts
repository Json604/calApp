import {calculateBmr} from '../../src/utils/bmr';

describe('calculateBmr', () => {
  it('uses Mifflin-St Jeor for a 74.8 kg, 178 cm, 28 year old male', () => {
    const bmr = calculateBmr({
      weightKg: 74.8,
      heightCm: 178,
      age: 28,
      sex: 'male',
    });
    expect(bmmrRound(bmr)).toBe(1726);
  });

  it('uses Mifflin-St Jeor for a female with the -161 offset', () => {
    const male = calculateBmr({
      weightKg: 70,
      heightCm: 165,
      age: 30,
      sex: 'male',
    });
    const female = calculateBmr({
      weightKg: 70,
      heightCm: 165,
      age: 30,
      sex: 'female',
    });
    expect(female).toBe(male - 166);
  });
});

function bmmrRound(value: number): number {
  return Math.round(value);
}
