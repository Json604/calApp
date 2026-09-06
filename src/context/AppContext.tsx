import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Appearance} from 'react-native';
import {configureAiFromSettings} from '../services/ai';
import {createRepositories, type Repositories} from '../storage';
import {defaultSettings} from '../storage/settingsRepository';
import {resolveTheme, type Theme} from '../theme';
import type {
  ActivityEntry,
  AppSettings,
  DailyEnergyBreakdown,
  FoodEntry,
  MealType,
  SavedFood,
  SavedMeal,
  UserGoal,
  UserProfile,
  WeightEntry,
  Workout,
} from '../types';
import {todayKey} from '../utils/dates';
import {calculateDailyEnergy} from '../utils/energyBalance';
import {createId} from '../utils/id';
import {applyCutTargets} from '../utils/tdee';

interface AppState {
  ready: boolean;
  profile: UserProfile | null;
  goal: UserGoal | null;
  settings: AppSettings;
  foods: FoodEntry[];
  savedFoods: SavedFood[];
  savedMeals: SavedMeal[];
  workouts: Workout[];
  activeWorkout: Workout | null;
  activities: ActivityEntry[];
  weights: WeightEntry[];
  theme: Theme;
}

interface AppActions {
  completeOnboarding: (profile: UserProfile, goal: UserGoal) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  updateGoal: (goal: UserGoal) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  addFoods: (entries: Array<Omit<FoodEntry, 'id'>>) => Promise<void>;
  updateFood: (entry: FoodEntry) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  saveFoodTemplate: (food: Omit<SavedFood, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteSavedFood: (id: string) => Promise<void>;
  saveMealTemplate: (meal: Omit<SavedMeal, 'id' | 'createdAt'>) => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setActiveWorkout: (workout: Workout | null) => Promise<void>;
  addActivity: (entry: Omit<ActivityEntry, 'id'>) => Promise<void>;
  updateActivity: (entry: ActivityEntry) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addWeight: (entry: Omit<WeightEntry, 'id'>) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;
  energyForDate: (date: string) => DailyEnergyBreakdown | null;
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

export function AppProvider({
  children,
  repositories = createRepositories(),
}: {
  children: React.ReactNode;
  repositories?: Repositories;
}) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings());
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkoutState] = useState<Workout | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({colorScheme: next}) => {
      setColorScheme(next);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await repositories.migrate();
      const [
        loadedProfile,
        loadedGoal,
        loadedSettings,
        loadedFoods,
        loadedSaved,
        loadedMeals,
        loadedWorkouts,
        loadedActive,
        loadedActivities,
        loadedWeights,
      ] = await Promise.all([
        repositories.profile.getProfile(),
        repositories.profile.getGoal(),
        repositories.settings.get(),
        repositories.food.listFoods(),
        repositories.food.listSavedFoods(),
        repositories.food.listSavedMeals(),
        repositories.workout.list(),
        repositories.workout.getActive(),
        repositories.activity.list(),
        repositories.weight.list(),
      ]);
      if (cancelled) {
        return;
      }
      let goal = loadedGoal;
      if (loadedProfile && loadedGoal) {
        const nextGoal = applyCutTargets(loadedProfile, loadedGoal);
        if (
          nextGoal.weeklyWeightLossTargetKg !== loadedGoal.weeklyWeightLossTargetKg ||
          nextGoal.calorieTarget !== loadedGoal.calorieTarget
        ) {
          await repositories.profile.saveGoal(nextGoal);
          goal = nextGoal;
        }
      }
      if (cancelled) {
        return;
      }
      setProfile(loadedProfile);
      setGoal(goal);
      setSettings(loadedSettings);
      setFoods(loadedFoods);
      setSavedFoods(loadedSaved);
      setSavedMeals(loadedMeals);
      setWorkouts(loadedWorkouts);
      setActiveWorkoutState(loadedActive);
      setActivities(loadedActivities);
      setWeights(loadedWeights);
      configureAiFromSettings(loadedSettings);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [repositories]);

  const theme = useMemo(
    () => resolveTheme(settings.theme),
    // colorScheme is read via Appearance inside resolveTheme; keep it in scope so theme updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.theme, colorScheme],
  );

  const completeOnboarding = useCallback(async (nextProfile: UserProfile, nextGoal: UserGoal) => {
    const goalWithTargets = applyCutTargets(nextProfile, nextGoal);
    await repositories.profile.saveProfile(nextProfile);
    await repositories.profile.saveGoal(goalWithTargets);
    await repositories.weight.upsert({
      id: createId(),
      date: todayKey(),
      weightKg: nextProfile.currentWeightKg,
      source: 'manual',
    });
    setProfile(nextProfile);
    setGoal(goalWithTargets);
    setWeights(await repositories.weight.list());
  }, [repositories]);

  const updateProfile = useCallback(async (next: UserProfile) => {
    await repositories.profile.saveProfile(next);
    setProfile(next);
    if (goal) {
      const nextGoal = applyCutTargets(next, goal);
      await repositories.profile.saveGoal(nextGoal);
      setGoal(nextGoal);
    }
  }, [goal, repositories]);

  const updateGoal = useCallback(async (next: UserGoal) => {
    const nextGoal = profile ? applyCutTargets(profile, next) : next;
    await repositories.profile.saveGoal(nextGoal);
    setGoal(nextGoal);
  }, [profile, repositories]);

  const updateSettings = useCallback(async (next: AppSettings) => {
    await repositories.settings.save(next);
    setSettings(next);
    configureAiFromSettings(next);
  }, [repositories]);

  const addFoods = useCallback(async (entries: Array<Omit<FoodEntry, 'id'>>) => {
    let current = foods;
    for (const entry of entries) {
      current = await repositories.food.upsertFood({...entry, id: createId()});
    }
    setFoods(current);
  }, [foods, repositories]);

  const updateFood = useCallback(async (entry: FoodEntry) => {
    setFoods(await repositories.food.upsertFood(entry));
  }, [repositories]);

  const deleteFood = useCallback(async (id: string) => {
    setFoods(await repositories.food.removeFood(id));
  }, [repositories]);

  const saveFoodTemplate = useCallback(async (
    food: Omit<SavedFood, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const now = new Date().toISOString();
    const next = await repositories.food.upsertSavedFood({
      ...food,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    });
    setSavedFoods(next);
  }, [repositories]);

  const deleteSavedFood = useCallback(async (id: string) => {
    setSavedFoods(await repositories.food.removeSavedFood(id));
  }, [repositories]);

  const saveMealTemplate = useCallback(async (meal: Omit<SavedMeal, 'id' | 'createdAt'>) => {
    const meals = await repositories.food.listSavedMeals();
    const next = [
      {id: createId(), createdAt: new Date().toISOString(), ...meal},
      ...meals,
    ];
    await repositories.food.saveSavedMeals(next);
    setSavedMeals(next);
  }, [repositories]);

  const addWorkout = useCallback(async (workout: Workout) => {
    setWorkouts(await repositories.workout.upsert(workout));
  }, [repositories]);

  const updateWorkout = useCallback(async (workout: Workout) => {
    setWorkouts(await repositories.workout.upsert(workout));
  }, [repositories]);

  const deleteWorkout = useCallback(async (id: string) => {
    setWorkouts(await repositories.workout.remove(id));
  }, [repositories]);

  const setActiveWorkout = useCallback(async (workout: Workout | null) => {
    await repositories.workout.saveActive(workout);
    setActiveWorkoutState(workout);
  }, [repositories]);

  const addActivity = useCallback(async (entry: Omit<ActivityEntry, 'id'>) => {
    setActivities(await repositories.activity.upsert({...entry, id: createId()}));
  }, [repositories]);

  const updateActivity = useCallback(async (entry: ActivityEntry) => {
    setActivities(await repositories.activity.upsert(entry));
  }, [repositories]);

  const deleteActivity = useCallback(async (id: string) => {
    setActivities(await repositories.activity.remove(id));
  }, [repositories]);

  const addWeight = useCallback(async (entry: Omit<WeightEntry, 'id'>) => {
    const next = await repositories.weight.upsert({...entry, id: createId()});
    setWeights(next);
    if (profile) {
      const updated = {...profile, currentWeightKg: entry.weightKg};
      await repositories.profile.saveProfile(updated);
      setProfile(updated);
    }
  }, [profile, repositories]);

  const deleteWeight = useCallback(async (id: string) => {
    setWeights(await repositories.weight.remove(id));
  }, [repositories]);

  const energyForDate = useCallback(
    (date: string): DailyEnergyBreakdown | null => {
      if (!profile || !goal) {
        return null;
      }
      return calculateDailyEnergy({
        date,
        profile,
        goal,
        foods: foods.filter(item => item.timestamp.slice(0, 10) === date),
        workouts: workouts.filter(
          item => item.startedAt.slice(0, 10) === date && item.endedAt,
        ),
        activities: activities.filter(item => item.timestamp.slice(0, 10) === date),
      });
    },
    [activities, foods, goal, profile, workouts],
  );

  const value = useMemo(
    () => ({
      ready,
      profile,
      goal,
      settings,
      foods,
      savedFoods,
      savedMeals,
      workouts,
      activeWorkout,
      activities,
      weights,
      theme,
      completeOnboarding,
      updateProfile,
      updateGoal,
      updateSettings,
      addFoods,
      updateFood,
      deleteFood,
      saveFoodTemplate,
      deleteSavedFood,
      saveMealTemplate,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      setActiveWorkout,
      addActivity,
      updateActivity,
      deleteActivity,
      addWeight,
      deleteWeight,
      energyForDate,
    }),
    [
      ready,
      profile,
      goal,
      settings,
      foods,
      savedFoods,
      savedMeals,
      workouts,
      activeWorkout,
      activities,
      weights,
      theme,
      completeOnboarding,
      updateProfile,
      updateGoal,
      updateSettings,
      addFoods,
      updateFood,
      deleteFood,
      saveFoodTemplate,
      deleteSavedFood,
      saveMealTemplate,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      setActiveWorkout,
      addActivity,
      updateActivity,
      deleteActivity,
      addWeight,
      deleteWeight,
      energyForDate,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used within AppProvider');
  }
  return value;
}

export function inferMealType(date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 11) {
    return 'breakfast';
  }
  if (hour < 15) {
    return 'lunch';
  }
  if (hour < 21) {
    return 'dinner';
  }
  return 'snack';
}
