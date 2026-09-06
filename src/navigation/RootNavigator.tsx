import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Activity, Dumbbell, Home, Settings, Utensils} from 'lucide-react-native';
import {useApp} from '../context/AppContext';
import type {MainTabParamList, RootStackParamList} from './types';
import {OnboardingScreen} from '../screens/onboarding/OnboardingScreen';
import {TodayScreen} from '../screens/today/TodayScreen';
import {FoodScreen} from '../screens/food/FoodScreen';
import {FoodFormScreen} from '../screens/food/FoodFormScreen';
import {SavedFoodsScreen} from '../screens/food/SavedFoodsScreen';
import {WorkoutScreen} from '../screens/workout/WorkoutScreen';
import {WorkoutSessionScreen} from '../screens/workout/WorkoutSessionScreen';
import {ProgressScreen} from '../screens/progress/ProgressScreen';
import {SettingsScreen} from '../screens/settings/SettingsScreen';
import {ProfileScreen} from '../screens/settings/ProfileScreen';
import {GoalsScreen} from '../screens/settings/GoalsScreen';
import {DebugScreen} from '../screens/settings/DebugScreen';
import {ActivityFormScreen} from '../screens/today/ActivityFormScreen';
import {WeightFormScreen} from '../screens/today/WeightFormScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const {theme} = useApp();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.faint,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.line,
        },
      }}>
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{tabBarIcon: ({color, size}) => <Home color={color} size={size} />}}
      />
      <Tab.Screen
        name="Food"
        component={FoodScreen}
        options={{tabBarIcon: ({color, size}) => <Utensils color={color} size={size} />}}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{tabBarIcon: ({color, size}) => <Dumbbell color={color} size={size} />}}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{tabBarIcon: ({color, size}) => <Activity color={color} size={size} />}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{tabBarIcon: ({color, size}) => <Settings color={color} size={size} />}}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const {ready, profile, theme} = useApp();
  if (!ready) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg}}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.ink,
      border: theme.colors.line,
      primary: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{headerBackTitle: 'Back'}}>
        {!profile ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}} />
            <Stack.Screen name="FoodForm" component={FoodFormScreen} options={{title: 'Food'}} />
            <Stack.Screen
              name="WorkoutSession"
              component={WorkoutSessionScreen}
              options={{title: 'Session'}}
            />
            <Stack.Screen
              name="ActivityForm"
              component={ActivityFormScreen}
              options={{title: 'Activity'}}
            />
            <Stack.Screen
              name="WeightForm"
              component={WeightFormScreen}
              options={{title: 'Weight'}}
            />
            <Stack.Screen
              name="SavedFoods"
              component={SavedFoodsScreen}
              options={{title: 'Saved foods'}}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{title: 'Profile'}} />
            <Stack.Screen name="Goals" component={GoalsScreen} options={{title: 'Goals'}} />
            <Stack.Screen name="Debug" component={DebugScreen} options={{title: 'Developer'}} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
