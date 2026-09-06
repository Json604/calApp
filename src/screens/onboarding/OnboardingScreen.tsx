import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {Input} from '../../components/Input';
import {Screen} from '../../components/Screen';
import {
  ACTIVITY_LEVEL_COPY,
  MAX_WEEKLY_FAT_LOSS_KG,
  WEEKLY_LOSS_OPTIONS,
} from '../../constants/energy';
import {useApp} from '../../context/AppContext';
import type {ActivityLevel, Sex} from '../../types';
import {createId} from '../../utils/id';
import {
  calculateBaseDailyExpenditure,
  calorieFloorKcal,
  clampWeeklyLossKg,
  dailyDeficitFromWeeklyLoss,
  suggestCalorieTarget,
  suggestProteinTargetG,
} from '../../utils/tdee';

const LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very_active'];

export function OnboardingScreen() {
  const {theme, completeOnboarding} = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goalKg, setGoalKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [weekly, setWeekly] = useState(0.5);
  const [protein, setProtein] = useState('');

  const numbers = {
    age: Number(age),
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    goalKg: Number(goalKg),
  };
  const bodyReady =
    numbers.age >= 14 &&
    numbers.age <= 90 &&
    numbers.heightCm >= 120 &&
    numbers.heightCm <= 230 &&
    numbers.weightKg >= 35 &&
    numbers.weightKg <= 250 &&
    numbers.goalKg >= 35 &&
    numbers.goalKg < numbers.weightKg;

  const suggestedProtein = suggestProteinTargetG(numbers.weightKg || 70);
  const calorieTarget = useMemo(() => {
    if (!bodyReady) {
      return 0;
    }
    return suggestCalorieTarget({
      age: numbers.age,
      sex,
      heightCm: numbers.heightCm,
      weightKg: numbers.weightKg,
      activityLevel,
      weeklyWeightLossTargetKg: weekly,
    });
  }, [activityLevel, bodyReady, numbers.age, numbers.heightCm, numbers.weightKg, sex, weekly]);
  const base = bodyReady
    ? calculateBaseDailyExpenditure({
        age: numbers.age,
        sex,
        heightCm: numbers.heightCm,
        weightKg: numbers.weightKg,
        activityLevel,
      })
    : null;
  const deficit = Math.round(dailyDeficitFromWeeklyLoss(weekly));
  const floor = calorieFloorKcal(sex);

  const canContinue =
    step === 0
      ? numbers.age >= 14 && numbers.age <= 90
      : step === 1
        ? bodyReady
        : true;

  const finish = async () => {
    if (!bodyReady) {
      return;
    }
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
        weeklyWeightLossTargetKg: clampWeeklyLossKg(weekly),
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
            ? 'Height, weight, goal'
            : step === 2
              ? 'Everyday movement'
              : 'Your cut'}
      </Text>
      <Text style={[styles.sub, {color: theme.colors.muted}]}>
        Height is required for BMR. Local estimates only — you can change targets later.
      </Text>

      {step === 0 ? (
        <View style={styles.stack}>
          <Input label="Name (optional)" value={name} onChangeText={setName} />
          <Input
            label="Age (required)"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="e.g. 28"
          />
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
          <Input
            label="Height (cm) — required"
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
            placeholder="e.g. 178"
          />
          <Input
            label="Current weight (kg) — required"
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            placeholder="e.g. 74.8"
          />
          <Input
            label="Goal weight (kg) — required"
            value={goalKg}
            onChangeText={setGoalKg}
            keyboardType="decimal-pad"
            placeholder="must be below current weight"
          />
          <Text style={[styles.desc, {color: theme.colors.faint}]}>
            Mifflin-St Jeor BMR uses weight, height, age, and sex. Without height the burn estimate is wrong.
          </Text>
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
            This is non-exercise movement (NEAT): job, walking, standing. It is not gym time.
            Logged workouts are added on top so exercise is not counted twice.
          </Text>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.stack}>
          <Text style={[styles.desc, {color: theme.colors.muted}]}>
            Maximum planned fat loss is {MAX_WEEKLY_FAT_LOSS_KG} kg/week.
          </Text>
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
              Planned daily deficit {deficit} kcal
            </Text>
            <Text style={[styles.desc, {color: theme.colors.muted}]}>
              ~7700 kcal ≈ 1 kg fat, so {weekly} kg/week is about {deficit} kcal/day below estimated burn. Estimate only.
            </Text>
            {base ? (
              <Text style={[styles.desc, {color: theme.colors.muted}]}>
                BMR {Math.round(base.bmr)} kcal + daily movement {Math.round(base.dailyMovement)} kcal = {Math.round(base.baseDailyExpenditure)} kcal living burn (no gym).
                Food target {calorieTarget} kcal (floor {floor} kcal). Protein default {suggestedProtein} g (~2.0 g/kg).
              </Text>
            ) : null}
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
            <Button
              label="Continue"
              disabled={!canContinue}
              onPress={() => setStep(step + 1)}
            />
          ) : (
            <Button label="Start logging" disabled={!bodyReady} onPress={finish} />
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
