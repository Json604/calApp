import React from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Screen} from '../../components/Screen';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import {bestSet, lastPerformance} from '../../utils/strengthTrend';

export function WorkoutScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const {theme, workouts, activeWorkout, deleteWorkout} = useApp();
  const {logAnything} = useVoice();
  const recent = [...workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 12);

  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.ink}]}>Workout</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button
            label={activeWorkout ? 'Resume' : 'Start workout'}
            onPress={() => navigation.navigate('WorkoutSession', {id: activeWorkout?.id})}
          />
        </View>
        <View style={styles.flex}>
          <Button label="Voice" variant="secondary" onPress={() => logAnything({expectedIntent: 'workout'})} />
        </View>
      </View>
      {recent.length === 0 ? (
        <EmptyState title="No workouts yet" body="Start a session or speak a set." />
      ) : (
        recent.map(workout => (
          <Card
            key={workout.id}
            onPress={() => navigation.navigate('WorkoutSession', {id: workout.id})}>
            <Text style={[styles.item, {color: theme.colors.ink}]}>{workout.name}</Text>
            <Text style={{color: theme.colors.muted, marginTop: 4}}>
              {workout.exercises.length} exercises · {workout.startedAt.slice(0, 10)}
            </Text>
            {workout.exercises.slice(0, 2).map(exercise => {
              const last = lastPerformance(workouts.filter(item => item.id !== workout.id), exercise.name);
              const best = last ? bestSet(last) : null;
              return (
                <Text key={exercise.id} style={{color: theme.colors.faint, marginTop: 4}}>
                  {exercise.name}
                  {best ? `  · last ${best.weightKg} × ${best.reps}` : ''}
                </Text>
              );
            })}
            <Button
              label="Delete"
              variant="ghost"
              onPress={() =>
                Alert.alert('Delete workout?', workout.name, [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(workout.id)},
                ])
              }
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 32, fontWeight: '600', marginBottom: 16},
  row: {flexDirection: 'row', gap: 8, marginBottom: 16},
  flex: {flex: 1},
  item: {fontSize: 16, fontWeight: '600'},
});
