import React from 'react';
import {StyleSheet, View, type TextInputProps} from 'react-native';
import {Input} from './Input';
import {VoiceButton} from './VoiceButton';

export function VoiceField({
  onVoice,
  ...rest
}: TextInputProps & {label?: string; onVoice: () => void}) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Input {...rest} />
      </View>
      <View style={styles.mic}>
        <VoiceButton size="sm" onPress={onVoice} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'flex-end', gap: 10},
  flex: {flex: 1},
  mic: {paddingBottom: 6},
});
