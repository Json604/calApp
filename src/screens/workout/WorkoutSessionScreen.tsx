import React, {useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {Input} from '../../components/Input';
import {Screen} from '../../components/Screen';
import {VoiceButton} from '../../components/VoiceButton';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import type {Exercise, Intensity, Workout} from '../../types';
import {createId} from '../../utils/id';
import {estimateActivityCalories} from '../../utils/met';
import {bestSet, compareBestSets, lastPerformance} from '../../utils/strengthTrend';

export function WorkoutSessionScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'WorkoutSession'>) {
  const app = useApp();
  const {logAnything} = useVoice();
  const existing =
    app.workouts.find(item => item.id === route.params.id) ??
    (app.activeWorkout?.id === route.params.id ? app.activeWorkout : null);
  const [name, setName] = useState(existing?.name ?? 'Workout');
  const [intensity, setIntensity] = useState<Intensity>(existing?.intensity ?? 'moderate');
  const [exercises, setExercises] = useState<Exercise[]>(existing?.exercises ?? []);
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const current = exercises[exercises.length - 1];

  const draft: Workout = useMemo(
    () => ({
      id: existing?.id ?? app.activeWorkout?.id ?? createId(),
      startedAt: existing?.startedAt ?? app.activeWorkout?.startedAt ?? new Date().toISOString(),
      name,
      intensity,
      exercises,
      estimatedCalories: existing?.estimatedCalories ?? 0,
      source: existing?.source ?? 'manual',
    }),
    [app.activeWorkout, existing, exercises, intensity, name],
  );

  useEffect(() => {
    app.setActiveWorkout(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, draft.name, exercises, intensity]);

  const addExercise = () => {
    if (!exerciseName.trim()) {
      return;
    }
    setExercises(list => [
      ...list,
      {id: createId(), name: exerciseName.trim(), sets: []},
    ]);
    setExerciseName('');
  };

  const addSet = () => {
    if (!current) {
      return;
    }
    const nextWeight = Number(weight);
    const nextReps = Number(reps);
    if (!nextWeight || !nextReps) {
      return;
    }
    setExercises(list =>
      list.map(item =>
        item.id === current.id
          ? {
              ...item,
              sets: [
                ...item.sets,
                {id: createId(), weightKg: nextWeight, reps: nextReps, completed: true},
              ],
            }
          : item,
      ),
    );
  };

  const finish = async () => {
    const duration = Math.max(
      1,
      Math.round((Date.now() - new Date(draft.startedAt).getTime()) / 60000),
    );
    const calories = app.profile
      ? estimateActivityCalories({
          activityType: 'Strength training',
          intensity,
          durationMinutes: duration,
          bodyWeightKg: app.profile.currentWeightKg,
        }).estimatedCalories
      : 0;
    await app.addWorkout({
      ...draft,
      endedAt: new Date().toISOString(),
      durationMinutes: duration,
      estimatedCalories: calories,
    });
    await app.setActiveWorkout(null);
    navigation.goBack();
  };

  const last = current ? lastPerformance(app.workouts, current.name) : null;
  const lastBest = last ? bestSet(last) : null;
  const currentBest = current ? bestSet(current) : null;
  const delta = compareBestSets(lastBest, currentBest);

  return (
    <Screen>
      <Input label="Session name" value={name} onChangeText={setName} />
      <View style={styles.row}>
        {(['light', 'moderate', 'vigorous'] as Intensity[]).map(option => (
          <View key={option} style={styles.flex}>
            <Button
              label={option}
              variant={intensity === option ? 'primary' : 'ghost'}
              onPress={() => setIntensity(option)}
            />
          </View>
        ))}
      </View>
      {current && lastBest ? (
        <Card>
          <Text style={{color: app.theme.colors.muted}}>Last time {current.name}</Text>
          {last?.sets.map(set => (
            <Text key={set.id} style={{color: app.theme.colors.ink}}>
              {set.weightKg} × {set.reps}
            </Text>
          ))}
          {currentBest ? (
            <Text style={{color: app.theme.colors.accent, marginTop: 8}}>
              {delta === 'up' ? '↑ improvement' : delta === 'down' ? '↓ lighter than last' : 'Maintaining'}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {exercises.map(exercise => (
        <Card key={exercise.id}>
          <Text style={[styles.item, {color: app.theme.colors.ink}]}>{exercise.name}</Text>
          {exercise.sets.map(set => (
            <Text key={set.id} style={{color: app.theme.colors.muted}}>
              {set.weightKg} kg × {set.reps}
            </Text>
          ))}
        </Card>
      ))}

      <Input label="Add exercise" value={exerciseName} onChangeText={setExerciseName} />
      <Button label="Add exercise" variant="secondary" onPress={addExercise} />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input label="kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        </View>
        <View style={styles.flex}>
          <Input label="Reps" value={reps} onChangeText={setReps} keyboardType="number-pad" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label="Add set" onPress={addSet} />
        </View>
        <VoiceButton
          onPress={() =>
            logAnything({
              expectedIntent: 'workout',
              activeWorkout: true,
              currentExerciseName: current?.name,
              previousSet: current?.sets.at(-1)
                ? {weightKg: current.sets[current.sets.length - 1].weightKg, reps: current.sets[current.sets.length - 1].reps}
                : undefined,
            })
          }
        />
      </View>
      <Button label="Finish workout" onPress={finish} />
      <Button
        label="Discard"
        variant="ghost"
        onPress={() =>
          Alert.alert('Discard session?', undefined, [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Discard',
              style: 'destructive',
              onPress: async () => {
                await app.setActiveWorkout(null);
                navigation.goBack();
              },
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginVertical: 10},
  flex: {flex: 1},
  item: {fontSize: 16, fontWeight: '600', marginBottom: 6},
});
