import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import type {Intensity} from '../../types';
import {estimateActivityCalories} from '../../utils/met';

export function ActivityFormScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'ActivityForm'>) {
  const app = useApp();
  const {logAnything} = useVoice();
  const existing = app.activities.find(item => item.id === route.params.id);
  const [name, setName] = useState(existing?.activityType ?? '');
  const [minutes, setMinutes] = useState(existing?.durationMinutes?.toString() ?? '45');
  const [intensity, setIntensity] = useState<Intensity>(existing?.intensity ?? 'moderate');

  const save = async () => {
    if (!app.profile) {
      return;
    }
    const calc = estimateActivityCalories({
      activityType: name || 'Activity',
      intensity,
      durationMinutes: Number(minutes) || 0,
      bodyWeightKg: app.profile.currentWeightKg,
    });
    const payload = {
      timestamp: existing?.timestamp ?? new Date().toISOString(),
      activityType: calc.canonicalName,
      durationMinutes: Number(minutes) || 0,
      intensity,
      met: calc.met,
      estimatedCalories: calc.estimatedCalories,
      source: existing?.source ?? 'manual',
    };
    if (existing) {
      await app.updateActivity({...existing, ...payload});
    } else {
      await app.addActivity(payload);
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <VoiceField
        label="Activity"
        value={name}
        onChangeText={setName}
        onVoice={() => logAnything({expectedIntent: 'activity'})}
      />
      <VoiceField
        label="Duration (min)"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
        onVoice={() =>
          logAnything({
            fieldKind: 'duration',
            onFieldValue: value => setMinutes(String(value)),
          })
        }
      />
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
      <Button label={existing ? 'Save' : 'Add activity'} onPress={save} />
      {existing ? (
        <Button
          label="Delete"
          variant="danger"
          onPress={() =>
            Alert.alert('Delete activity?', name, [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await app.deleteActivity(existing.id);
                  navigation.goBack();
                },
              },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8, marginVertical: 16},
  flex: {flex: 1},
});
