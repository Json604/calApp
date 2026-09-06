import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';

export function Metric({
  label,
  value,
  hint,
  large,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  large?: boolean;
  color?: string;
}) {
  const {theme} = useApp();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, {color: theme.colors.muted}]}>{label}</Text>
      <Text
        style={[
          large ? styles.large : styles.value,
          {color: color ?? theme.colors.ink},
        ]}>
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, {color: theme.colors.faint}]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 4},
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  large: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: -1.4,
  },
  hint: {fontSize: 13},
});
