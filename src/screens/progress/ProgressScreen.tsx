import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Card} from '../../components/Card';
import {LineChart} from '../../components/LineChart';
import {Screen} from '../../components/Screen';
import {SectionHeader} from '../../components/SectionHeader';
import {useApp} from '../../context/AppContext';
import {useDailySummary} from '../../hooks/useDailySummary';
import {COMMON_EXERCISES} from '../../constants/exercises';
import {exerciseHistorySummary} from '../../utils/strengthTrend';
import {formatKcal} from '../../utils/units';

export function ProgressScreen() {
  const {theme, profile, goal, weights, workouts} = useApp();
  const summary = useDailySummary();
  const points = [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(entry => ({xLabel: entry.date.slice(5), y: entry.weightKg}));
  const strength = exerciseHistorySummary(
    workouts,
    [...COMMON_EXERCISES].filter(name =>
      workouts.some(workout =>
        workout.exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase()),
      ),
    ).slice(0, 6),
  );

  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.ink}]}>Cut progress</Text>
      {profile && goal && summary.progress ? (
        <Card>
          <Text style={[styles.meta, {color: theme.colors.muted}]}>
            {profile.startingWeightKg.toFixed(1)} kg  →  {goal.goalWeightKg.toFixed(1)} kg
          </Text>
          <Text style={[styles.now, {color: theme.colors.ink}]}>
            {profile.currentWeightKg.toFixed(1)} kg
          </Text>
          <View style={[styles.track, {backgroundColor: theme.colors.surface2}]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(4, summary.progress.percent)}%`,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
          <Text style={[styles.meta, {color: theme.colors.muted}]}>
            {summary.progress.percent}% complete · lost {summary.progress.lostKg} kg · {summary.progress.remainingKg} kg remaining
          </Text>
        </Card>
      ) : null}

      <SectionHeader title="Weight" />
      <Card>
        <LineChart points={points} />
        <Text style={[styles.meta, {color: theme.colors.muted, marginTop: 8}]}>
          7-day average {summary.trend.sevenDayAverage ?? '—'} kg · previous {summary.trend.previousSevenDayAverage ?? '—'} kg
        </Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          Trend {summary.trend.weeklyTrendKg ?? '—'} kg/week · estimate only
        </Text>
      </Card>

      <SectionHeader title="Last 7 days" />
      <Card>
        <Row label="Avg intake" value={summary.avgIntake ? formatKcal(summary.avgIntake) : '—'} />
        <Row label="Avg burn" value={summary.avgBurn ? formatKcal(summary.avgBurn) : '—'} />
        <Row
          label="Avg deficit"
          value={
            summary.avgBalance === null
              ? '—'
              : `${Math.abs(summary.avgBalance)} kcal`
          }
        />
        <Row label="Protein days" value={`${summary.proteinStreak} streak`} />
        <Row label="Workouts" value={`${summary.todayWorkouts.length ? summary.workoutCount : summary.workoutCount}`} />
        <Row
          label="Est. remaining"
          value={summary.weeksRemaining === null ? '—' : `~${summary.weeksRemaining} weeks`}
        />
        <Text style={[styles.meta, {color: theme.colors.faint, marginTop: 8}]}>
          Energy expenditure and pace are estimates, not measurements.
        </Text>
      </Card>

      <SectionHeader title="Strength during the cut" />
      {strength.length === 0 ? (
        <Text style={{color: theme.colors.muted}}>Log compound lifts to track whether strength is holding.</Text>
      ) : (
        strength.map(item => (
          <Card key={item.name}>
            <Text style={[styles.item, {color: theme.colors.ink}]}>{item.name}</Text>
            <Text style={[styles.meta, {color: theme.colors.muted}]}>
              {item.best
                ? `Best recently ${item.best.weightKg} × ${item.best.reps} · est. 1RM ${item.estimated1rm} kg`
                : 'No sets yet'}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

function Row({label, value}: {label: string; value: string}) {
  const {theme} = useApp();
  return (
    <View style={styles.row}>
      <Text style={{color: theme.colors.muted}}>{label}</Text>
      <Text style={{color: theme.colors.ink, fontWeight: '600'}}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 32, fontWeight: '600', marginBottom: 16},
  now: {fontSize: 40, fontWeight: '600', letterSpacing: -1.2, marginVertical: 8},
  meta: {fontSize: 13, lineHeight: 18},
  track: {height: 8, borderRadius: 99, overflow: 'hidden', marginVertical: 10},
  fill: {height: 8, borderRadius: 99},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6},
  item: {fontSize: 16, fontWeight: '600'},
});
