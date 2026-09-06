import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Alert} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {ParsedEntryPreview} from '../components/ParsedEntryPreview';
import {
  VoiceRecordingSheet,
  type VoiceUiState,
} from '../components/VoiceRecordingSheet';
import {parseUserInput, type ParseContext} from '../services/ai/extraction/parser';
import {createTranscriptionManager} from '../services/ai/transcription/TranscriptionManager';
import {
  openAppSettings,
  requestMicrophonePermission,
} from '../services/voice/permissions';
import {
  cancelRecording,
  startRecording,
  stopRecording,
} from '../services/voice/recorder';
import type {Intent, ParsedUserInput} from '../types';
import {todayKey} from '../utils/dates';
import {estimateActivityCalories} from '../utils/met';
import {createId} from '../utils/id';
import {inferMealType, useApp} from './AppContext';
import type {FieldKind} from '../services/matching/localParse';
import {parseFieldValue} from '../services/matching/localParse';

interface VoiceOpenOptions {
  expectedIntent?: Intent;
  fieldKind?: FieldKind;
  currentExerciseName?: string;
  previousSet?: {weightKg: number; reps: number};
  activeWorkout?: boolean;
  onFieldValue?: (value: number | string) => void;
  draft?: ParsedUserInput;
}

interface VoiceContextValue {
  offline: boolean;
  logAnything: (options?: VoiceOpenOptions) => void;
  correctDraft: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({children}: {children: React.ReactNode}) {
  const app = useApp();
  const [sheet, setSheet] = useState(false);
  const [ui, setUi] = useState<VoiceUiState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [preview, setPreview] = useState(false);
  const [parsed, setParsed] = useState<ParsedUserInput | null>(null);
  const [transcript, setTranscript] = useState('');
  const [offline, setOffline] = useState(false);
  const optionsRef = useRef<VoiceOpenOptions>({});
  const recordingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener(state => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => sub();
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const closeSheet = useCallback(async () => {
    stopTimer();
    if (recordingRef.current) {
      recordingRef.current = false;
      await cancelRecording();
    }
    setSheet(false);
    setUi('idle');
    setSeconds(0);
    setError(undefined);
  }, []);

  const parseContext = useCallback((): ParseContext => {
    const options = optionsRef.current;
    return {
      expectedIntent: options.expectedIntent,
      fieldKind: options.fieldKind,
      savedFoods: app.savedFoods,
      recentFoods: app.foods.slice(0, 12).map(item => item.name),
      recentExercises: app.workouts
        .flatMap(workout => workout.exercises.map(ex => ex.name))
        .slice(0, 12),
      localCommands: {
        foods: app.foods,
        workouts: app.workouts,
        savedFoods: app.savedFoods,
      },
      currentExerciseName: options.currentExerciseName,
      previousSet: options.previousSet,
      activeWorkout: options.activeWorkout,
      draft: options.draft ?? parsed ?? undefined,
    };
  }, [app.foods, app.savedFoods, app.workouts, parsed]);

  const runParse = useCallback(
    async (text: string) => {
      const options = optionsRef.current;
      if (options.fieldKind && options.onFieldValue) {
        const field = parseFieldValue(text, options.fieldKind);
        if (field) {
          options.onFieldValue(field.value);
          setPreview(false);
          return;
        }
      }
      const result = await parseUserInput({text, context: parseContext()});
      setParsed(result);
      setPreview(true);
    },
    [parseContext],
  );

  const finishRecording = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }
    recordingRef.current = false;
    stopTimer();
    setUi('processing');
    try {
      const path = await stopRecording();
      const manager = createTranscriptionManager(app.settings);
      const result = await manager.transcribe(path);
      setTranscript(result.text);
      await runParse(result.text);
      setSheet(false);
      setUi('parsed');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Voice capture failed. You can still log this manually.';
      setError(
        /not configured|network|timeout|unavailable/i.test(message)
          ? 'AI parsing is temporarily unavailable. You can still log this manually.'
          : message,
      );
      setUi('error');
    }
  }, [app.settings, runParse]);

  const logAnything = useCallback(
    async (options: VoiceOpenOptions = {}) => {
      optionsRef.current = options;
      const permission = await requestMicrophonePermission();
      if (permission !== 'granted') {
        Alert.alert(
          'Microphone needed',
          permission === 'blocked'
            ? 'Microphone access is off for CutLog. Enable it in Android settings, then try again.'
            : 'Enable microphone access to log by voice. Manual logging still works.',
          permission === 'blocked'
            ? [
                {text: 'Not now', style: 'cancel'},
                {text: 'Open settings', onPress: openAppSettings},
              ]
            : [{text: 'OK'}],
        );
        return;
      }
      try {
        setError(undefined);
        setSeconds(0);
        setSheet(true);
        setUi('listening');
        await startRecording();
        recordingRef.current = true;
        timerRef.current = setInterval(() => {
          setSeconds(value => value + 1);
        }, 1000);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not start the microphone.';
        setError(message);
        setUi('error');
        setSheet(true);
      }
    },
    [],
  );

  const persist = useCallback(async () => {
    if (!parsed || parsed.intent === 'unknown') {
      return;
    }
    if (parsed.intent === 'food') {
      await app.addFoods(
        parsed.data.items.map(item => ({
          timestamp: new Date().toISOString(),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories ?? 0,
          protein: item.protein ?? 0,
          carbs: item.carbs ?? 0,
          fat: item.fat ?? 0,
          mealType: parsed.data.mealType ?? inferMealType(),
          source: item.savedFoodId ? 'saved' : item.estimated ? 'ai' : 'manual',
          estimated: item.estimated,
          savedFoodId: item.savedFoodId,
        })),
      );
    } else if (parsed.intent === 'workout') {
      const workout = {
        id: app.activeWorkout?.id ?? createId(),
        startedAt: app.activeWorkout?.startedAt ?? new Date().toISOString(),
        endedAt: new Date().toISOString(),
        name: parsed.data.name ?? app.activeWorkout?.name ?? 'Workout',
        intensity: parsed.data.intensity ?? 'moderate',
        estimatedCalories: 0,
        source: 'ai' as const,
        exercises: parsed.data.exercises.map(exercise => ({
          id: createId(),
          name: exercise.name,
          notes: exercise.notes,
          sets: exercise.sets.map(set => ({
            id: createId(),
            weightKg: set.weightKg,
            reps: set.reps,
            completed: true,
          })),
        })),
      };
      const calories = app.profile
        ? estimateActivityCalories({
            activityType: 'Strength training',
            intensity: workout.intensity,
            durationMinutes: parsed.data.durationMinutes ?? 45,
            bodyWeightKg: app.profile.currentWeightKg,
          }).estimatedCalories
        : 0;
      await app.addWorkout({...workout, estimatedCalories: calories, durationMinutes: parsed.data.durationMinutes ?? 45});
    } else if (parsed.intent === 'activity' && app.profile) {
      const calc = estimateActivityCalories({
        activityType: parsed.data.activityType,
        intensity: parsed.data.intensity,
        durationMinutes: parsed.data.durationMinutes,
        bodyWeightKg: app.profile.currentWeightKg,
        suggestedMET: parsed.data.suggestedMET,
      });
      await app.addActivity({
        timestamp: new Date().toISOString(),
        activityType: calc.canonicalName,
        durationMinutes: parsed.data.durationMinutes,
        intensity: parsed.data.intensity,
        met: calc.met,
        estimatedCalories: calc.estimatedCalories,
        source: 'ai',
      });
    } else if (parsed.intent === 'weight') {
      await app.addWeight({
        date: parsed.data.date ?? todayKey(),
        weightKg: parsed.data.weightKg,
        source: 'ai',
      });
    } else if (parsed.intent === 'goal_update' && app.goal) {
      await app.updateGoal({
        ...app.goal,
        goalWeightKg: parsed.data.goalWeightKg ?? app.goal.goalWeightKg,
        weeklyWeightLossTargetKg:
          parsed.data.weeklyWeightLossTargetKg ?? app.goal.weeklyWeightLossTargetKg,
        calorieTarget: parsed.data.calorieTarget ?? app.goal.calorieTarget,
        proteinTargetG: parsed.data.proteinTargetG ?? app.goal.proteinTargetG,
      });
    } else if (parsed.intent === 'profile_update' && app.profile) {
      await app.updateProfile({
        ...app.profile,
        name: parsed.data.name ?? app.profile.name,
        age: parsed.data.age ?? app.profile.age,
        heightCm: parsed.data.heightCm ?? app.profile.heightCm,
        currentWeightKg: parsed.data.currentWeightKg ?? app.profile.currentWeightKg,
        activityLevel: parsed.data.activityLevel ?? app.profile.activityLevel,
      });
    }
    setPreview(false);
    setParsed(null);
  }, [app, parsed]);

  const retryFromTranscript = useCallback(async () => {
    if (!transcript.trim()) {
      return;
    }
    await runParse(transcript);
  }, [runParse, transcript]);

  const correctDraft = useCallback(() => {
    if (!parsed) {
      return;
    }
    logAnything({draft: parsed, expectedIntent: parsed.intent});
  }, [logAnything, parsed]);

  const value = useMemo(
    () => ({offline, logAnything, correctDraft}),
    [offline, logAnything, correctDraft],
  );

  return (
    <VoiceContext.Provider value={value}>
      {children}
      <VoiceRecordingSheet
        visible={sheet}
        state={ui}
        seconds={seconds}
        error={error}
        onStop={finishRecording}
        onCancel={closeSheet}
      />
      <ParsedEntryPreview
        visible={preview}
        parsed={parsed}
        transcript={transcript}
        onChangeTranscript={setTranscript}
        onChange={setParsed}
        onSave={persist}
        onEdit={correctDraft}
        onRetry={retryFromTranscript}
        onDismiss={() => setPreview(false)}
      />
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const value = useContext(VoiceContext);
  if (!value) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return value;
}
