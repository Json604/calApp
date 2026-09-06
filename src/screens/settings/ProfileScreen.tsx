import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import type {ActivityLevel, Sex} from '../../types';

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Profile'>) {
  const {profile, updateProfile} = useApp();
  const {logAnything} = useVoice();
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(String(profile?.age ?? ''));
  const [height, setHeight] = useState(String(profile?.heightCm ?? ''));
  const [weight, setWeight] = useState(String(profile?.currentWeightKg ?? ''));
  const [sex] = useState<Sex>(profile?.sex ?? 'male');
  const [activity] = useState<ActivityLevel>(profile?.activityLevel ?? 'light');

  if (!profile) {
    return null;
  }

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
        label="Height (cm)"
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
      <Button
        label="Save profile"
        onPress={async () => {
          await updateProfile({
            ...profile,
            name: name.trim() || undefined,
            age: Number(age),
            heightCm: Number(height),
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
