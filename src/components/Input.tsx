import React from 'react';
import {StyleSheet, Text, TextInput, View, type TextInputProps} from 'react-native';
import {useApp} from '../context/AppContext';
import {radius} from '../theme';

export function Input({
  label,
  ...rest
}: TextInputProps & {label?: string}) {
  const {theme} = useApp();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, {color: theme.colors.muted}]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.faint}
        style={[
          styles.input,
          {
            color: theme.colors.ink,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.line,
          },
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 8},
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
});
