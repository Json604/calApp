import React, {useState} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';

export function GoalsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Goals'>) {
  const {goal, updateGoal} = useApp();
  const {logAnything} = useVoice();
  const [goalKg, setGoalKg] = useState(String(goal?.goalWeightKg ?? ''));
  const [weekly, setWeekly] = useState(String(goal?.weeklyWeightLossTargetKg ?? '0.5'));
  const [calories, setCalories] = useState(String(goal?.calorieTarget ?? ''));
  const [protein, setProtein] = useState(String(goal?.proteinTargetG ?? ''));

  if (!goal) {
    return null;
  }

  return (
    <Screen>
      <VoiceField
        label="Goal weight (kg)"
        value={goalKg}
        onChangeText={setGoalKg}
        keyboardType="decimal-pad"
        onVoice={() => logAnything({fieldKind: 'weight', onFieldValue: v => setGoalKg(String(v))})}
      />
      <VoiceField
        label="Weekly loss (kg)"
        value={weekly}
        onChangeText={setWeekly}
        keyboardType="decimal-pad"
        onVoice={() => logAnything({fieldKind: 'number', onFieldValue: v => setWeekly(String(v))})}
      />
      <VoiceField
        label="Calorie target"
        value={calories}
        onChangeText={setCalories}
        keyboardType="number-pad"
        onVoice={() =>
          logAnything({fieldKind: 'calories', onFieldValue: v => setCalories(String(v))})
        }
      />
      <VoiceField
        label="Protein target (g)"
        value={protein}
        onChangeText={setProtein}
        keyboardType="number-pad"
        onVoice={() =>
          logAnything({fieldKind: 'protein', onFieldValue: v => setProtein(String(v))})
        }
      />
      <Button
        label="Save goals"
        onPress={async () => {
          await updateGoal({
            goalWeightKg: Number(goalKg),
            weeklyWeightLossTargetKg: Number(weekly),
            calorieTarget: Number(calories),
            proteinTargetG: Number(protein),
          });
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
