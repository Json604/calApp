import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {MAX_WEEKLY_FAT_LOSS_KG, WEEKLY_LOSS_OPTIONS} from '../../constants/energy';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import {
  clampWeeklyLossKg,
  dailyDeficitFromWeeklyLoss,
  suggestCalorieTarget,
} from '../../utils/tdee';

export function GoalsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Goals'>) {
  const {goal, profile, theme, updateGoal} = useApp();
  const {logAnything} = useVoice();
  const [goalKg, setGoalKg] = useState(String(goal?.goalWeightKg ?? ''));
  const [weekly, setWeekly] = useState(
    clampWeeklyLossKg(goal?.weeklyWeightLossTargetKg ?? 0.5),
  );
  const [protein, setProtein] = useState(String(goal?.proteinTargetG ?? ''));

  const suggested = useMemo(() => {
    if (!profile) {
      return 0;
    }
    return suggestCalorieTarget({
      weightKg: profile.currentWeightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      weeklyWeightLossTargetKg: weekly,
    });
  }, [profile, weekly]);

  if (!goal || !profile) {
    return null;
  }

  const deficit = Math.round(dailyDeficitFromWeeklyLoss(weekly));

  return (
    <Screen>
      <VoiceField
        label="Goal weight (kg)"
        value={goalKg}
        onChangeText={setGoalKg}
        keyboardType="decimal-pad"
        onVoice={() => logAnything({fieldKind: 'weight', onFieldValue: v => setGoalKg(String(v))})}
      />
      <Text style={[styles.label, {color: theme.colors.muted}]}>
        Weekly fat-loss target (max {MAX_WEEKLY_FAT_LOSS_KG} kg)
      </Text>
      <View style={styles.row}>
        {WEEKLY_LOSS_OPTIONS.map(option => (
          <View key={option} style={styles.chip}>
            <Button
              label={`${option} kg`}
              variant={weekly === option ? 'primary' : 'secondary'}
              onPress={() => setWeekly(option)}
            />
          </View>
        ))}
      </View>
      <Card>
        <Text style={[styles.item, {color: theme.colors.ink}]}>
          Food target {suggested} kcal
        </Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          That is about {deficit} kcal/day below estimated living burn (no gym). Recalculated from height, weight, age, sex, and everyday movement. Max rate {MAX_WEEKLY_FAT_LOSS_KG} kg/week.
        </Text>
      </Card>
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
            weeklyWeightLossTargetKg: weekly,
            calorieTarget: suggested,
            proteinTargetG: Number(protein) || goal.proteinTargetG,
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
    marginBottom: 8,
    marginTop: 8,
  },
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  chip: {minWidth: 88},
  item: {fontSize: 16, fontWeight: '600'},
  meta: {fontSize: 13, marginTop: 4, lineHeight: 18},
});
