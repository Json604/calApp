import type {NavigatorScreenParams} from '@react-navigation/native';

export type MainTabParamList = {
  Today: undefined;
  Food: undefined;
  Workout: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  FoodForm: {id?: string; mealType?: string};
  WorkoutSession: {id?: string};
  ActivityForm: {id?: string};
  WeightForm: undefined;
  SavedFoods: undefined;
  Profile: undefined;
  Goals: undefined;
  Debug: undefined;
};
