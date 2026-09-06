import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Metric} from '../../components/Metric';
import {ProgressBar} from '../../components/ProgressBar';
import {Screen} from '../../components/Screen';
import {SectionHeader} from '../../components/SectionHeader';
import {VoiceButton} from '../../components/VoiceButton';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import {useDailySummary} from '../../hooks/useDailySummary';
import {formatDisplayDate, todayKey} from '../../utils/dates';
import {formatKcal} from '../../utils/units';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';

export function TodayScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const {theme, settings} = useApp();
  const {logAnything, offline} = useVoice();
  const summary = useDailySummary();
  const [breakdown, setBreakdown] = useState(false);
  const energy = summary.energy;
  const foodLogged = Boolean(energy?.foodLogged);
  const deficitLabel = !energy || !foodLogged
    ? 'Target'
    : energy.isDeficit
      ? 'Deficit'
      : 'Surplus';
  const heroValue = !energy
    ? '—'
    : !foodLogged
      ? `${energy.calorieTarget}`
      : `${Math.abs(energy.balance)}`;
  const deficitColor =
    !energy || !foodLogged
      ? theme.colors.ink
      : energy.isDeficit
        ? theme.colors.deficit
        : theme.colors.surplus;

  return (
    <Screen>
      <Text style={[styles.kicker, {color: theme.colors.muted}]}>Today</Text>
      <Text style={[styles.date, {color: theme.colors.ink}]}>
        {formatDisplayDate(todayKey())}
      </Text>
      {offline ? (
        <Text style={[styles.offline, {color: theme.colors.accent}]}>
          Offline — manual logging still works. Voice needs a network.
        </Text>
      ) : null}

      <Card onPress={() => setBreakdown(value => !value)} style={styles.energy}>
        <Metric
          label={deficitLabel}
          value={heroValue}
          hint={
            foodLogged
              ? 'kcal  ·  estimated'
              : 'kcal  ·  log food to see today’s deficit'
          }
          large
          color={deficitColor}
        />
        <View style={styles.split}>
          <Metric label="Consumed" value={energy ? formatKcal(energy.caloriesConsumed) : '—'} />
          <Metric label="Estimated burn" value={energy ? formatKcal(energy.estimatedDailyBurn) : '—'} />
        </View>
        {settings.showLastProvider ? (
          <Text style={[styles.hint, {color: theme.colors.faint}]}>Tap for energy breakdown</Text>
        ) : (
          <Text style={[styles.hint, {color: theme.colors.faint}]}>Tap for energy breakdown</Text>
        )}
        {breakdown && energy ? (
          <View style={styles.break}>
            <Row label="BMR" value={energy.bmr} />
            <Row label="Daily movement" value={energy.dailyMovement} />
            <Row label="Workout" value={energy.workoutCalories} />
            <Row label="Activity" value={energy.activityCalories} />
            <Row label="Estimated burn" value={energy.estimatedDailyBurn} bold />
            <Row label="Food" value={energy.caloriesConsumed} />
            {energy.foodLogged ? (
              <Row
                label={energy.isDeficit ? 'Deficit' : 'Surplus'}
                value={Math.abs(energy.balance)}
                bold
              />
            ) : (
              <Row label="Target" value={energy.calorieTarget} bold />
            )}
          </View>
        ) : null}
      </Card>

      {energy ? (
        <View style={styles.bars}>
          <ProgressBar
            label="Calories"
            current={energy.caloriesConsumed}
            target={energy.calorieTarget}
            unit="kcal"
          />
          <ProgressBar
            label="Protein"
            current={energy.proteinG}
            target={energy.proteinTargetG}
            unit="g"
            color={theme.colors.protein}
          />
          <Text style={[styles.hint, {color: theme.colors.muted}]}>
            Carbs {energy.carbsG} g · Fat {energy.fatG} g
          </Text>
        </View>
      ) : null}

      <View style={styles.stats}>
        <Mini label="Weight" value={summary.trend.current ? `${summary.trend.current} kg` : '—'} />
        <Mini label="Exercise" value={energy ? `${energy.exerciseCalories} kcal` : '—'} />
        <Mini
          label="Workout"
          value={summary.todayWorkouts.length ? 'Logged' : 'None yet'}
        />
        <Mini label="Streak" value={`${summary.foodStreak}d food`} />
      </View>

      <View style={styles.micWrap}>
        <VoiceButton size="lg" label="Log anything" onPress={() => logAnything()} />
      </View>

      <View style={styles.actions}>
        <Quick label="+ Food" onPress={() => navigation.navigate('FoodForm', {})} />
        <Quick label="+ Workout" onPress={() => navigation.navigate('WorkoutSession', {})} />
        <Quick label="+ Weight" onPress={() => navigation.navigate('WeightForm')} />
        <Quick label="+ Activity" onPress={() => navigation.navigate('ActivityForm', {})} />
      </View>

      <SectionHeader title="Today's food" action="All" onAction={() => navigation.navigate('Main', {screen: 'Food'})} />
      {summary.todayFoods.length === 0 ? (
        <EmptyState title="Nothing logged yet" body="Add a meal or speak it." />
      ) : (
        summary.todayFoods.map(item => (
          <Card key={item.id} onPress={() => navigation.navigate('FoodForm', {id: item.id})}>
            <View style={styles.row}>
              <Text style={[styles.item, {color: theme.colors.ink}]}>{item.name}</Text>
              <Text style={[styles.meta, {color: theme.colors.muted}]}>{item.calories} kcal</Text>
            </View>
            <Text style={[styles.meta, {color: theme.colors.faint}]}>
              {item.protein}p · {item.carbs}c · {item.fat}f
              {item.estimated ? '  ·  estimated' : ''}
            </Text>
          </Card>
        ))
      )}

      <SectionHeader title="Today's workout" />
      {summary.todayWorkouts.length === 0 ? (
        <EmptyState title="No session yet" body="Start a workout or log one by voice." />
      ) : (
        summary.todayWorkouts.map(item => (
          <Card key={item.id}>
            <Text style={[styles.item, {color: theme.colors.ink}]}>{item.name}</Text>
            <Text style={[styles.meta, {color: theme.colors.muted}]}>
              {item.exercises.length} exercises · ~{item.estimatedCalories} kcal estimated
            </Text>
          </Card>
        ))
      )}

      <SectionHeader title="Today's activity" />
      {summary.todayActivities.length === 0 ? (
        <EmptyState title="No extra activity" body="Walks, sports, and cardio live here." />
      ) : (
        summary.todayActivities.map(item => (
          <Card key={item.id}>
            <Text style={[styles.item, {color: theme.colors.ink}]}>{item.activityType}</Text>
            <Text style={[styles.meta, {color: theme.colors.muted}]}>
              {item.durationMinutes} min · ~{item.estimatedCalories} kcal estimated
            </Text>
          </Card>
        ))
      )}

      <Card style={styles.trend}>
        <Text style={[styles.item, {color: theme.colors.ink}]}>7-day trend</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          {summary.avgBalance === null
            ? 'Log a few days to see pace.'
            : `Your 7-day average ${summary.avgBalance < 0 ? 'deficit' : 'surplus'} is ~${Math.abs(summary.avgBalance)} kcal/day.`}
        </Text>
        {summary.weeklyChangeKg !== null ? (
          <Text style={[styles.meta, {color: theme.colors.muted}]}>
            Estimated weight change at this pace: ~{Math.abs(summary.weeklyChangeKg)} kg/week. Estimate only.
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

function Row({label, value, bold}: {label: string; value: number; bold?: boolean}) {
  const {theme} = useApp();
  return (
    <View style={styles.row}>
      <Text style={{color: theme.colors.muted, fontWeight: bold ? '700' : '400'}}>{label}</Text>
      <Text style={{color: theme.colors.ink, fontWeight: bold ? '700' : '500'}}>
        {value.toLocaleString('en-US')}
      </Text>
    </View>
  );
}

function Mini({label, value}: {label: string; value: string}) {
  const {theme} = useApp();
  return (
    <View style={[styles.mini, {borderColor: theme.colors.line, backgroundColor: theme.colors.surface}]}>
      <Text style={[styles.miniLabel, {color: theme.colors.muted}]}>{label}</Text>
      <Text style={[styles.miniValue, {color: theme.colors.ink}]}>{value}</Text>
    </View>
  );
}

function Quick({label, onPress}: {label: string; onPress: () => void}) {
  const {theme} = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.quick,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          transform: [{scale: pressed ? 0.97 : 1}],
        },
      ]}>
      <Text style={{color: theme.colors.ink, fontWeight: '600'}}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: {fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase'},
  date: {fontSize: 28, fontWeight: '600', letterSpacing: -0.6, marginBottom: 16},
  offline: {marginBottom: 12, fontSize: 13},
  energy: {gap: 16, marginBottom: 18},
  split: {flexDirection: 'row', justifyContent: 'space-between'},
  hint: {fontSize: 13},
  break: {gap: 8, paddingTop: 8},
  bars: {gap: 14, marginBottom: 16},
  stats: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20},
  mini: {width: '47%', borderWidth: 1, borderRadius: 16, padding: 12},
  miniLabel: {fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase'},
  miniValue: {fontSize: 16, fontWeight: '600', marginTop: 4},
  micWrap: {alignItems: 'center', marginVertical: 12},
  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18},
  quick: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  item: {fontSize: 16, fontWeight: '600'},
  meta: {fontSize: 13, marginTop: 4},
  trend: {marginTop: 12, gap: 6},
});
