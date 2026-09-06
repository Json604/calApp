import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useApp} from '../context/AppContext';
import type {ParsedUserInput} from '../types';
import {radius} from '../theme';
import {Button} from './Button';
import {Input} from './Input';

export function ParsedEntryPreview({
  visible,
  parsed,
  transcript,
  onChangeTranscript,
  onChange,
  onSave,
  onEdit,
  onRetry,
  onDismiss,
  saving,
}: {
  visible: boolean;
  parsed: ParsedUserInput | null;
  transcript: string;
  onChangeTranscript: (text: string) => void;
  onChange: (next: ParsedUserInput) => void;
  onSave: () => void;
  onEdit?: () => void;
  onRetry: () => void;
  onDismiss: () => void;
  saving?: boolean;
}) {
  const {theme} = useApp();
  const [showTranscript, setShowTranscript] = useState(false);
  if (!parsed) {
    return null;
  }

  const unknown = parsed.intent === 'unknown';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.overlay, {backgroundColor: theme.colors.overlay}]}>
        <View style={[styles.sheet, {backgroundColor: theme.colors.surface, borderColor: theme.colors.line}]}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={[styles.kicker, {color: theme.colors.muted}]}>
              {parsed.intent.replace('_', ' ')}
            </Text>
            <Text style={[styles.title, {color: theme.colors.ink}]}>Confirm before saving</Text>
            {parsed.warnings.map(warning => (
              <Text key={warning} style={[styles.warning, {color: theme.colors.accent}]}>
                {warning}
              </Text>
            ))}
            {renderBody(parsed, onChange, theme.colors.ink, theme.colors.muted)}
            <Pressable onPress={() => setShowTranscript(value => !value)}>
              <Text style={[styles.link, {color: theme.colors.accent}]}>
                {showTranscript ? 'Hide transcript' : 'Show / edit transcript'}
              </Text>
            </Pressable>
            {showTranscript ? (
              <Input
                value={transcript}
                onChangeText={onChangeTranscript}
                multiline
              />
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            {unknown ? (
              <>
                <View style={styles.flex}>
                  <Button label="Retry" variant="secondary" onPress={onRetry} />
                </View>
                <View style={styles.flex}>
                  <Button label="Close" onPress={onDismiss} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.flex}>
                  <Button label="Edit" variant="ghost" onPress={onEdit ?? onDismiss} />
                </View>
                <View style={styles.flex}>
                  <Button label="Add" onPress={onSave} loading={saving} />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function renderBody(
  parsed: ParsedUserInput,
  onChange: (next: ParsedUserInput) => void,
  ink: string,
  muted: string,
) {
  if (parsed.intent === 'food') {
    const total = parsed.data.items.reduce((sum, item) => sum + (item.calories ?? 0), 0);
    const protein = parsed.data.items.reduce((sum, item) => sum + (item.protein ?? 0), 0);
    return (
      <View style={styles.block}>
        {parsed.data.items.map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.item, {color: ink}]}>{item.name}</Text>
              <Text style={[styles.meta, {color: muted}]}>
                {item.quantity ?? '?'} {item.unit}
                {item.estimated ? ' · estimated' : ''}
              </Text>
            </View>
            <Text style={[styles.kcal, {color: ink}]}>
              {item.calories !== null ? `${Math.round(item.calories)} kcal` : '—'}
            </Text>
          </View>
        ))}
        <View style={styles.total}>
          <Text style={[styles.item, {color: ink}]}>Total</Text>
          <Text style={[styles.kcal, {color: ink}]}>
            {Math.round(total)} kcal · {Math.round(protein)} g protein
          </Text>
        </View>
      </View>
    );
  }
  if (parsed.intent === 'workout') {
    return (
      <View style={styles.block}>
        {parsed.data.exercises.map(exercise => (
          <View key={exercise.name} style={styles.block}>
            <Text style={[styles.item, {color: ink}]}>{exercise.name}</Text>
            {exercise.sets.map((set, index) => (
              <Text key={index} style={[styles.meta, {color: muted}]}>
                {set.weightKg} kg × {set.reps}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  }
  if (parsed.intent === 'activity') {
    return (
      <Text style={[styles.item, {color: ink}]}>
        {parsed.data.activityType} · {parsed.data.durationMinutes} min · {parsed.data.intensity}
      </Text>
    );
  }
  if (parsed.intent === 'weight') {
    return (
      <Text style={[styles.item, {color: ink}]}>{parsed.data.weightKg} kg</Text>
    );
  }
  if (parsed.intent === 'goal_update') {
    return (
      <Text style={[styles.item, {color: ink}]}>
        {parsed.data.goalWeightKg ? `Goal weight ${parsed.data.goalWeightKg} kg` : 'Goal update'}
      </Text>
    );
  }
  if (parsed.intent === 'unknown') {
    return (
      <Text style={[styles.item, {color: ink}]}>
        {parsed.data.reason}. You can retry, edit the transcript, or log this manually.
      </Text>
    );
  }
  return (
    <Text style={[styles.item, {color: ink}]}>Profile update ready to apply.</Text>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 28,
  },
  scroll: {gap: 12, paddingBottom: 12},
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {fontSize: 24, fontWeight: '600', letterSpacing: -0.4},
  warning: {fontSize: 13},
  block: {gap: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', gap: 12},
  item: {fontSize: 16, fontWeight: '600'},
  meta: {fontSize: 13, marginTop: 2},
  kcal: {fontSize: 15, fontWeight: '600'},
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  link: {fontSize: 14, fontWeight: '600'},
  actions: {flexDirection: 'row', gap: 10, marginTop: 8},
  flex: {flex: 1},
});
