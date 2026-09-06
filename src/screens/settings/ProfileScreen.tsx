import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {ACTIVITY_LEVEL_COPY} from '../../constants/energy';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import type {ActivityLevel, Sex} from '../../types';

const LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very_active'];

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Profile'>) {
  const {profile, updateProfile, theme} = useApp();
  const {logAnything} = useVoice();
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(String(profile?.age ?? ''));
  const [height, setHeight] = useState(String(profile?.heightCm ?? ''));
  const [weight, setWeight] = useState(String(profile?.currentWeightKg ?? ''));
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male');
  const [activity, setActivity] = useState<ActivityLevel>(
    profile?.activityLevel ?? 'light',
  );

  if (!profile) {
    return null;
  }

  const heightCm = Number(height);
  const canSave =
    Number(age) >= 14 &&
    heightCm >= 120 &&
    heightCm <= 230 &&
    Number(weight) >= 35;

  return (
    <Screen>
      <VoiceField label="Name" value={name} onChangeText={setName} onVoice={() => undefined} />
      <VoiceField
        label="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        onVoice={() => logAnything({fieldKind: 'number', onFieldValue: v => setAge(String(v))})}
      />
      <VoiceField
        label="Height (cm) — required for BMR"
        value={height}
        onChangeText={setHeight}
        keyboardType="decimal-pad"
        onVoice={() => logAnything({fieldKind: 'number', onFieldValue: v => setHeight(String(v))})}
      />
      <VoiceField
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        onVoice={() =>
          logAnything({
            expectedIntent: 'weight',
            fieldKind: 'weight',
            onFieldValue: v => setWeight(String(v)),
          })
        }
      />
      <Text style={[styles.label, {color: theme.colors.muted}]}>Sex</Text>
      <View style={styles.row}>
        {(['male', 'female'] as Sex[]).map(option => (
          <View key={option} style={styles.flex}>
            <Button
              label={option}
              variant={sex === option ? 'primary' : 'secondary'}
              onPress={() => setSex(option)}
            />
          </View>
        ))}
      </View>
      <Text style={[styles.label, {color: theme.colors.muted}]}>Everyday movement (not gym)</Text>
      {LEVELS.map(level => (
        <Button
          key={level}
          label={`${ACTIVITY_LEVEL_COPY[level].label}${activity === level ? ' · selected' : ''}`}
          variant={activity === level ? 'primary' : 'ghost'}
          onPress={() => setActivity(level)}
        />
      ))}
      <Button
        label="Save profile"
        disabled={!canSave}
        onPress={async () => {
          await updateProfile({
            ...profile,
            name: name.trim() || undefined,
            age: Number(age),
            heightCm,
            currentWeightKg: Number(weight),
            sex,
            activityLevel: activity,
          });
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {flexDirection: 'row', gap: 8, marginBottom: 8},
  flex: {flex: 1},
});
