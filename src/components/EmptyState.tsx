import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';

export function EmptyState({title, body}: {title: string; body: string}) {
  const {theme} = useApp();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, {color: theme.colors.ink}]}>{title}</Text>
      <Text style={[styles.body, {color: theme.colors.muted}]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {paddingVertical: 18, gap: 6},
  title: {fontSize: 16, fontWeight: '600'},
  body: {fontSize: 14, lineHeight: 20},
});
