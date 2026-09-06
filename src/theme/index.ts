import {Appearance, StyleSheet} from 'react-native';
import {darkColors, lightColors, type ThemeColors} from './colors';
import type {ThemePreference} from '../types';

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

export function resolveTheme(preference: ThemePreference): Theme {
  const systemDark = Appearance.getColorScheme() === 'dark';
  const dark =
    preference === 'system' ? systemDark : preference === 'dark';
  return {dark, colors: dark ? darkColors : lightColors};
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
};

export const type = StyleSheet.create({
  display: {
    fontSize: 52,
    fontWeight: '600',
    letterSpacing: -1.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export {lightColors, darkColors};
export type {ThemeColors};
