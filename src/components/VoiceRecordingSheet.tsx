import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';
import {radius} from '../theme';
import {Button} from './Button';

export type VoiceUiState = 'idle' | 'listening' | 'processing' | 'parsed' | 'error';

export function VoiceRecordingSheet({
  visible,
  state,
  seconds,
  error,
  onStop,
  onCancel,
}: {
  visible: boolean;
  state: VoiceUiState;
  seconds: number;
  error?: string;
  onStop: () => void;
  onCancel: () => void;
}) {
  const {theme} = useApp();
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const title =
    state === 'listening'
      ? 'Listening…'
      : state === 'processing'
        ? 'Processing…'
        : state === 'error'
          ? 'Voice failed'
          : 'Log anything';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.overlay, {backgroundColor: theme.colors.overlay}]} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, {backgroundColor: theme.colors.surface, borderColor: theme.colors.line}]}
          onPress={() => undefined}>
          <View style={styles.dotRow}>
            <View
              style={[
                styles.dot,
                {backgroundColor: state === 'listening' ? theme.colors.danger : theme.colors.faint},
              ]}
            />
            <Text style={[styles.title, {color: theme.colors.ink}]}>{title}</Text>
          </View>
          <Text style={[styles.timer, {color: theme.colors.ink}]}>
            {mm}:{ss}
          </Text>
          {error ? (
            <Text style={[styles.error, {color: theme.colors.danger}]}>{error}</Text>
          ) : (
            <Text style={[styles.hint, {color: theme.colors.muted}]}>
              Food, workout, activity, or weight. Recording starts only while this sheet is open.
            </Text>
          )}
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="ghost" onPress={onCancel} />
            </View>
            <View style={styles.flex}>
              <Button
                label={state === 'processing' ? 'Working' : 'Stop'}
                onPress={onStop}
                loading={state === 'processing'}
                disabled={state === 'processing'}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  dotRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dot: {width: 10, height: 10, borderRadius: 5},
  title: {fontSize: 20, fontWeight: '600'},
  timer: {fontSize: 44, fontWeight: '600', letterSpacing: -1.2},
  hint: {fontSize: 14, lineHeight: 20},
  error: {fontSize: 14, lineHeight: 20},
  actions: {flexDirection: 'row', gap: 10, marginTop: 8},
  flex: {flex: 1},
});
