import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Polyline} from 'react-native-svg';
import {useApp} from '../context/AppContext';

export function LineChart({
  points,
  height = 140,
}: {
  points: Array<{xLabel: string; y: number}>;
  height?: number;
}) {
  const {theme} = useApp();
  if (points.length === 0) {
    return <Text style={{color: theme.colors.muted}}>Not enough data yet.</Text>;
  }
  const width = 320;
  const ys = points.map(p => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const coords = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * (width - 8) + 4;
      const y = height - 16 - ((point.y - min) / span) * (height - 28);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline
          points={coords}
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.labels}>
        <Text style={[styles.label, {color: theme.colors.faint}]}>{points[0].xLabel}</Text>
        <Text style={[styles.label, {color: theme.colors.faint}]}>
          {points[points.length - 1].xLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {flexDirection: 'row', justifyContent: 'space-between'},
  label: {fontSize: 11},
});
