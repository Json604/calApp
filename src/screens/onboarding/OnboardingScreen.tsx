import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {Input} from '../../components/Input';
import {Screen} from '../../components/Screen';
import {ACTIVITY_LEVEL_COPY, WEEKLY_LOSS_OPTIONS} from '../../constants/energy';
import {useApp} from '../../context/AppContext';
import type {ActivityLevel, Sex} from '../../types';
import {createId} from '../../utils/id';
import {
  calculateBaseDailyExpenditure,
  dailyDeficitFromWeeklyLoss,
  suggestCalorieTarget,
  suggestProteinTargetG,
} from '../../utils/tdee';

const LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very_active'];

export function OnboardingScreen() {
  const {theme, completeOnboarding} = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('28');
  const [sex, setSex] = useState<Sex>('male');
  const [heightCm, setHeightCm] = useState('178');
  const [weightKg, setWeightKg] = useState('74.8');
  const [goalKg, setGoalKg] = useState('70');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [weekly, setWeekly] = useState(0.5);
  const [protein, setProtein] = useState('');

  const numbers = {
    age: Number(age),
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    goalKg: Number(goalKg),
  };
  const suggestedProtein = suggestProteinTargetG(numbers.weightKg || 70);
  const calorieTarget = useMemo(
    () =>
      suggestCalorieTarget({
        age: numbers.age || 28,
        sex,
        heightCm: numbers.heightCm || 170,
        weightKg: numbers.weightKg || 70,
        activityLevel,
        weeklyWeightLossTargetKg: weekly,
      }),
    [activityLevel, numbers.age, numbers.heightCm, numbers.weightKg, sex, weekly],
  );
  const base = calculateBaseDailyExpenditure({
    age: numbers.age || 28,
    sex,
    heightCm: numbers.heightCm || 170,
    weightKg: numbers.weightKg || 70,
    activityLevel,
  });
  const deficit = Math.round(dailyDeficitFromWeeklyLoss(weekly));

  const finish = async () => {
    await completeOnboarding(
      {
        id: createId(),
        name: name.trim() || undefined,
        age: numbers.age,
        sex,
        heightCm: numbers.heightCm,
        currentWeightKg: numbers.weightKg,
        startingWeightKg: numbers.weightKg,
        activityLevel,
        createdAt: new Date().toISOString(),
      },
      {
        goalWeightKg: numbers.goalKg,
        weeklyWeightLossTargetKg: weekly,
        calorieTarget,
        proteinTargetG: Number(protein) || suggestedProtein,
      },
    );
  };

  return (
    <Screen>
      <Text style={[styles.kicker, {color: theme.colors.muted}]}>CutLog</Text>
      <Text style={[styles.title, {color: theme.colors.ink}]}>
        {step === 0
          ? 'About you'
          : step === 1
            ? 'Body'
            : step === 2
              ? 'Everyday movement'
              : 'Your cut'}
      </Text>
      <Text style={[styles.sub, {color: theme.colors.muted}]}>
        Local estimates only. You can change every target later.
      </Text>

      {step === 0 ? (
        <View style={styles.stack}>
          <Input label="Name (optional)" value={name} onChangeText={setName} />
          <Input label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
          <View style={styles.row}>
            {(['male', 'female'] as Sex[]).map(option => (
              <Chip
                key={option}
                label={option}
                selected={sex === option}
                onPress={() => setSex(option)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.stack}>
          <Input label="Height (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" />
          <Input label="Current weight (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
          <Input label="Goal weight (kg)" value={goalKg} onChangeText={setGoalKg} keyboardType="decimal-pad" />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.stack}>
          {LEVELS.map(level => (
            <Card key={level} onPress={() => setActivityLevel(level)}>
              <Text style={[styles.choice, {color: theme.colors.ink}]}>
                {ACTIVITY_LEVEL_COPY[level].label}
                {activityLevel === level ? '  ·  selected' : ''}
              </Text>
              <Text style={[styles.desc, {color: theme.colors.muted}]}>
                {ACTIVITY_LEVEL_COPY[level].description}
              </Text>
            </Card>
          ))}
          <Text style={[styles.desc, {color: theme.colors.faint}]}>
            This is everyday movement, not gym sessions. Logged workouts are added on top so exercise is not counted twice.
          </Text>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            {WEEKLY_LOSS_OPTIONS.map(option => (
              <Chip
                key={option}
                label={`${option} kg/wk`}
                selected={weekly === option}
                onPress={() => setWeekly(option)}
              />
            ))}
          </View>
          <Card>
            <Text style={[styles.choice, {color: theme.colors.ink}]}>
              Estimated daily deficit {deficit} kcal
            </Text>
            <Text style={[styles.desc, {color: theme.colors.muted}]}>
              7700 kcal ≈ 1 kg fat, so {weekly} kg/week is about {deficit} kcal/day. This is only an estimate.
            </Text>
            <Text style={[styles.desc, {color: theme.colors.muted}]}>
              Base burn without workouts: {Math.round(base.baseDailyExpenditure)} kcal. Suggested food target: {calorieTarget} kcal. Protein default {suggestedProtein} g (about 2.0 g/kg).
            </Text>
          </Card>
          <Input
            label="Protein target (g), optional"
            value={protein}
            onChangeText={setProtein}
            placeholder={String(suggestedProtein)}
            keyboardType="number-pad"
          />
        </View>
      ) : null}

      <View style={styles.nav}>
        {step > 0 ? (
          <View style={styles.flex}>
            <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} />
          </View>
        ) : null}
        <View style={styles.flex}>
          {step < 3 ? (
            <Button label="Continue" onPress={() => setStep(step + 1)} />
          ) : (
            <Button label="Start logging" onPress={finish} />
          )}
        </View>
      </View>
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      label={label}
      variant={selected ? 'primary' : 'secondary'}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  kicker: {fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase'},
  title: {fontSize: 32, fontWeight: '600', letterSpacing: -0.8, marginTop: 8},
  sub: {fontSize: 15, marginTop: 8, marginBottom: 22, lineHeight: 22},
  stack: {gap: 12},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  choice: {fontSize: 16, fontWeight: '600'},
  desc: {fontSize: 13, lineHeight: 19, marginTop: 4},
  nav: {flexDirection: 'row', gap: 10, marginTop: 28},
  flex: {flex: 1},
});
