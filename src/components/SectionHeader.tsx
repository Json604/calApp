import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const {theme} = useApp();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, {color: theme.colors.ink}]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, {color: theme.colors.accent}]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    marginTop: 8,
  },
  title: {fontSize: 18, fontWeight: '600', letterSpacing: -0.3},
  action: {fontSize: 14, fontWeight: '600'},
});
