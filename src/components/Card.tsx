import React from 'react';
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {useApp} from '../context/AppContext';
import {radius} from '../theme';

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}) {
  const {theme} = useApp();
  const body = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
        },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) {
    return body;
  }
  return (
    <Pressable onPress={onPress} style={({pressed}) => ({opacity: pressed ? 0.86 : 1, transform: [{scale: pressed ? 0.985 : 1}]})}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 18,
  },
});
