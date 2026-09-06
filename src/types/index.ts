export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export type EntrySource = 'manual' | 'saved' | 'ai' | 'copied';

export type Intensity = 'light' | 'moderate' | 'vigorous';

export type ThemePreference = 'system' | 'light' | 'dark';

export type ProviderId = 'groq' | 'nvidia';

export type Intent =
  | 'food'
  | 'workout'
  | 'activity'
  | 'weight'
  | 'profile_update'
  | 'goal_update'
  | 'unknown';

export type FoodUnit = 'g' | 'kg' | 'ml' | 'piece' | 'slice' | 'scoop' | 'cup' | 'tbsp' | 'tsp' | 'serving';

export interface UserProfile {
  id: string;
  name?: string;
  age: number;
  sex: Sex;
  heightCm: number;
  currentWeightKg: number;
  startingWeightKg: number;
  activityLevel: ActivityLevel;
  createdAt: string;
}

export interface UserGoal {
  goalWeightKg: number;
  weeklyWeightLossTargetKg: number;
  calorieTarget: number;
  proteinTargetG: number;
}

export interface AppSettings {
  theme: ThemePreference;
  weightUnit: 'kg';
  heightUnit: 'cm';
  primaryProvider: ProviderId;
  fallbackProvider: ProviderId;
  groqTextModel: string;
  nvidiaTextModel: string;
  transcriptionModel: string;
  groqApiKey: string;
  nvidiaApiKey: string;
  showLastProvider: boolean;
  quickVoiceLogging: boolean;
}

export interface FoodMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry extends FoodMacros {
  id: string;
  timestamp: string;
  name: string;
  quantity: number | null;
  unit: FoodUnit;
  mealType: MealType;
  source: EntrySource;
  estimated: boolean;
  savedFoodId?: string;
  notes?: string;
}

export interface SavedFood extends FoodMacros {
  id: string;
  name: string;
  defaultQuantity: number;
  unit: FoodUnit;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: Array<Omit<FoodEntry, 'id' | 'timestamp' | 'mealType'>>;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  activityType: string;
  durationMinutes: number;
  intensity: Intensity;
  met: number;
  estimatedCalories: number;
  notes?: string;
  source: EntrySource;
}

export interface ExerciseSet {
  id: string;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  durationMinutes?: number;
}

export interface Workout {
  id: string;
  startedAt: string;
  endedAt?: string;
  name: string;
  exercises: Exercise[];
  intensity: Intensity;
  durationMinutes?: number;
  estimatedCalories: number;
  source: EntrySource;
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  source: EntrySource;
}

export interface DraftFoodItem {
  name: string;
  quantity: number | null;
  unit: FoodUnit;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  confidence: number;
  estimated: boolean;
  savedFoodId?: string;
  warning?: string;
}

export interface DraftWorkoutExercise {
  name: string;
  sets: Array<{weightKg: number; reps: number}>;
  notes?: string;
}

export type ParsedUserInput =
  | ParsedFoodInput
  | ParsedWorkoutInput
  | ParsedActivityInput
  | ParsedWeightInput
  | ParsedGoalInput
  | ParsedProfileInput
  | UnknownInput;

export interface ParsedBase {
  confidence: number;
  transcript: string;
  warnings: string[];
  provider?: ProviderId;
}

export interface ParsedFoodInput extends ParsedBase {
  intent: 'food';
  data: {
    items: DraftFoodItem[];
    mealType?: MealType;
  };
}

export interface ParsedWorkoutInput extends ParsedBase {
  intent: 'workout';
  data: {
    name?: string;
    exercises: DraftWorkoutExercise[];
    durationMinutes?: number;
    intensity?: Intensity;
  };
}

export interface ParsedActivityInput extends ParsedBase {
  intent: 'activity';
  data: {
    activityType: string;
    durationMinutes: number;
    intensity: Intensity;
    suggestedMET?: number;
  };
}

export interface ParsedWeightInput extends ParsedBase {
  intent: 'weight';
  data: {
    weightKg: number;
    date?: string;
  };
}

export interface ParsedGoalInput extends ParsedBase {
  intent: 'goal_update';
  data: {
    goalWeightKg?: number;
    weeklyWeightLossTargetKg?: number;
    calorieTarget?: number;
    proteinTargetG?: number;
  };
}

export interface ParsedProfileInput extends ParsedBase {
  intent: 'profile_update';
  data: {
    name?: string;
    age?: number;
    heightCm?: number;
    currentWeightKg?: number;
    activityLevel?: ActivityLevel;
  };
}

export interface UnknownInput extends ParsedBase {
  intent: 'unknown';
  data: {
    reason: string;
  };
}

export interface DailyEnergyBreakdown {
  date: string;
  bmr: number;
  dailyMovement: number;
  baseDailyExpenditure: number;
  workoutCalories: number;
  activityCalories: number;
  exerciseCalories: number;
  estimatedDailyBurn: number;
  caloriesConsumed: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  calorieTarget: number;
  proteinTargetG: number;
  balance: number;
  isDeficit: boolean;
  foodLogged: boolean;
}

export interface AiDebugState {
  lastProvider?: ProviderId;
  lastLatencyMs?: number;
  lastError?: string;
  lastIntent?: Intent;
  lastTranscript?: string;
}
