import {useMemo} from 'react';
import {useApp} from '../context/AppContext';
import {dayRangeKeys, todayKey} from '../utils/dates';
import {
  averageBalance,
  averageBurn,
  averageIntake,
  estimatedWeeklyWeightChangeKg,
  estimatedWeeksRemaining,
} from '../utils/calorieProjection';
import {goalProgress, rollingWeightTrend} from '../utils/weightTrend';
import {
  foodLoggingStreak,
  proteinTargetStreak,
  totalWorkouts,
  workoutStreak,
  weightLoggingStreak,
} from '../utils/streaks';

export function useDailySummary(date = todayKey()) {
  const app = useApp();
  return useMemo(() => {
    const energy = app.energyForDate(date);
    const days = dayRangeKeys(new Date(`${date}T00:00:00`), 7)
      .map(key => app.energyForDate(key))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const avgBalance = averageBalance(days);
    const trend = rollingWeightTrend({entries: app.weights, endDateKey: date});
    const progress =
      app.profile && app.goal
        ? goalProgress({
            startKg: app.profile.startingWeightKg,
            currentKg: app.profile.currentWeightKg,
            goalKg: app.goal.goalWeightKg,
          })
        : null;
    return {
      energy,
      days,
      avgBalance,
      avgIntake: averageIntake(days),
      avgBurn: averageBurn(days),
      weeklyChangeKg:
        avgBalance === null ? null : estimatedWeeklyWeightChangeKg(avgBalance),
      weeksRemaining:
        progress && avgBalance !== null
          ? estimatedWeeksRemaining({
              remainingKg: progress.remainingKg,
              averageDailyBalance: avgBalance,
            })
          : null,
      trend,
      progress,
      foodStreak: foodLoggingStreak(app.foods, date),
      workoutStreak: workoutStreak(app.workouts, date),
      weightStreak: weightLoggingStreak(app.weights, date),
      proteinStreak: proteinTargetStreak(days, date),
      workoutCount: totalWorkouts(app.workouts),
      todayFoods: app.foods.filter(item => item.timestamp.startsWith(date)),
      todayWorkouts: app.workouts.filter(item => item.startedAt.startsWith(date)),
      todayActivities: app.activities.filter(item =>
        item.timestamp.startsWith(date),
      ),
    };
  }, [app, date]);
}
