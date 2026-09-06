import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';
import {radius} from '../theme';

export function ProgressBar({
  label,
  current,
  target,
  unit,
  color,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color?: string;
}) {
  const {theme} = useApp();
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const fill = color ?? theme.colors.accent;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, {color: theme.colors.ink}]}>{label}</Text>
        <Text style={[styles.value, {color: theme.colors.muted}]}>
          {Math.round(current)} / {Math.round(target)} {unit}
        </Text>
      </View>
      <View style={[styles.track, {backgroundColor: theme.colors.surface2}]}>
        <View
          style={[
            styles.fill,
            {width: `${Math.max(4, ratio * 100)}%`, backgroundColor: fill},
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  label: {fontSize: 15, fontWeight: '600'},
  value: {fontSize: 13},
  track: {height: 8, borderRadius: radius.full, overflow: 'hidden'},
  fill: {height: 8, borderRadius: radius.full},
});
