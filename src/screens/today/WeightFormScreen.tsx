import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import {todayKey} from '../../utils/dates';

export function WeightFormScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'WeightForm'>) {
  const {addWeight, profile} = useApp();
  const {logAnything} = useVoice();
  const [weight, setWeight] = useState(profile?.currentWeightKg?.toString() ?? '');

  return (
    <Screen>
      <VoiceField
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        onVoice={() =>
          logAnything({
            expectedIntent: 'weight',
            fieldKind: 'weight',
            onFieldValue: value => setWeight(String(value)),
          })
        }
      />
      <Button
        label="Save weight"
        onPress={async () => {
          await addWeight({
            date: todayKey(),
            weightKg: Number(weight),
            source: 'manual',
          });
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
