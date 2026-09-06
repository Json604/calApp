import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Mic} from 'lucide-react-native';
import {useApp} from '../context/AppContext';

export function VoiceButton({
  onPress,
  size = 'md',
  label,
}: {
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const {theme} = useApp();
  const dim = size === 'lg' ? 72 : size === 'sm' ? 36 : 48;
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        transform: [{scale: pressed ? 0.96 : 1}],
        alignItems: 'center',
        gap: 8,
      })}>
      <View
        style={[
          styles.btn,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: theme.colors.mic,
          },
        ]}>
        <Mic color="#fff" size={size === 'lg' ? 28 : size === 'sm' ? 16 : 20} />
      </View>
      {label ? (
        <Text style={[styles.label, {color: theme.colors.ink}]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {alignItems: 'center', justifyContent: 'center'},
  label: {fontSize: 14, fontWeight: '600', letterSpacing: -0.2},
});
