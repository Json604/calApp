import {
  averageBalance,
  averageIntake,
  estimatedWeeklyWeightChangeKg,
  estimatedWeeksRemaining,
} from '../../src/utils/calorieProjection';
import type {DailyEnergyBreakdown} from '../../src/types';
import {goalProgress, rollingWeightTrend} from '../../src/utils/weightTrend';
import {parseSpokenNumber} from '../../src/utils/spokenNumber';
import type {WeightEntry} from '../../src/types';

describe('weight trend', () => {
  it('averages the last 7 days and compares to the previous 7', () => {
    const entries: WeightEntry[] = [];
    for (let i = 1; i <= 14; i += 1) {
      const day = i < 10 ? `0${i}` : `${i}`;
      const kg = i <= 7 ? 75.4 : 74.9;
      entries.push({
        id: `${i}`,
        date: `2026-09-${day}`,
        weightKg: kg,
        source: 'manual',
      });
    }
    const trend = rollingWeightTrend({entries, endDateKey: '2026-09-14'});
    expect(trend.sevenDayAverage).toBeCloseTo(74.9, 1);
    expect(trend.previousSevenDayAverage).toBeCloseTo(75.4, 1);
    expect(trend.weeklyTrendKg).toBeCloseTo(-0.5, 1);
  });
});

describe('goal progress', () => {
  it('computes lost, remaining, and percent', () => {
    expect(
      goalProgress({startKg: 77, currentKg: 74.8, goalKg: 70}),
    ).toEqual({lostKg: 2.2, remainingKg: 4.8, percent: 31});
  });
});

function day(partial: Partial<DailyEnergyBreakdown>): DailyEnergyBreakdown {
  return {
    date: '2026-09-06',
    bmr: 1700,
    dailyMovement: 500,
    baseDailyExpenditure: 2200,
    workoutCalories: 0,
    activityCalories: 0,
    exerciseCalories: 0,
    estimatedDailyBurn: 2200,
    caloriesConsumed: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    calorieTarget: 1700,
    proteinTargetG: 150,
    balance: -2200,
    isDeficit: true,
    foodLogged: false,
    ...partial,
  };
}

describe('calorie projection', () => {
  it('ignores unlogged days so a blank week is not a 2200 kcal deficit', () => {
    expect(
      averageBalance([
        day({date: '2026-09-01'}),
        day({date: '2026-09-02'}),
        day({
          date: '2026-09-03',
          foodLogged: true,
          caloriesConsumed: 1700,
          balance: -500,
        }),
      ]),
    ).toBe(-500);
    expect(
      averageIntake([
        day({date: '2026-09-01'}),
        day({
          date: '2026-09-03',
          foodLogged: true,
          caloriesConsumed: 1700,
          balance: -500,
        }),
      ]),
    ).toBe(1700);
    expect(averageBalance([day({date: '2026-09-01'})])).toBeNull();
  });

  it('converts a 510 kcal daily deficit into ~0.46 kg/week', () => {
    expect(estimatedWeeklyWeightChangeKg(-510)).toBeCloseTo(-0.46, 2);
  });

  it('estimates remaining weeks from deficit pace', () => {
    expect(
      estimatedWeeksRemaining({remainingKg: 4.8, averageDailyBalance: -510}),
    ).toBe(10);
  });

  it('returns null remaining weeks in a surplus', () => {
    expect(
      estimatedWeeksRemaining({remainingKg: 4.8, averageDailyBalance: 200}),
    ).toBeNull();
  });
});

describe('spoken numbers', () => {
  it('parses seventy four point eight', () => {
    expect(parseSpokenNumber('seventy four point eight')).toBeCloseTo(74.8);
  });

  it('parses three hundred and twenty', () => {
    expect(parseSpokenNumber('three hundred and twenty')).toBe(320);
  });

  it('parses forty five minutes', () => {
    expect(parseSpokenNumber('forty five minutes')).toBe(45);
  });

  it('parses twelve', () => {
    expect(parseSpokenNumber('twelve')).toBe(12);
  });
});
