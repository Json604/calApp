import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {Input} from '../../components/Input';
import {Screen} from '../../components/Screen';
import {useApp} from '../../context/AppContext';
import type {RootStackParamList} from '../../navigation/types';
import type {ThemePreference} from '../../types';
import {checkForUpdate, currentVersion} from '../../update/updateChecker';
import {maskSecret, trimSecret} from '../../utils/secrets';

export function SettingsScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const {theme, settings, updateSettings, profile, goal} = useApp();
  const [versionName, setVersionName] = useState('');
  const [groqDraft, setGroqDraft] = useState('');
  const [nvidiaDraft, setNvidiaDraft] = useState('');
  useEffect(() => {
    void currentVersion().then(setVersionName);
  }, []);

  const saveKeys = () => {
    const groqApiKey = trimSecret(groqDraft) || settings.groqApiKey;
    const nvidiaApiKey = trimSecret(nvidiaDraft) || settings.nvidiaApiKey;
    void updateSettings({...settings, groqApiKey, nvidiaApiKey});
    setGroqDraft('');
    setNvidiaDraft('');
  };
  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.ink}]}>Settings</Text>
      <View style={styles.stack}>
      <Card onPress={() => navigation.navigate('Profile')}>
        <Text style={[styles.item, {color: theme.colors.ink}]}>Profile</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          {profile?.name ?? 'Unnamed'} · {profile?.age} · {profile?.currentWeightKg} kg
        </Text>
      </Card>
      <Card onPress={() => navigation.navigate('Goals')}>
        <Text style={[styles.item, {color: theme.colors.ink}]}>Goals</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          {goal?.calorieTarget} kcal · {goal?.proteinTargetG} g protein · {goal?.goalWeightKg} kg
        </Text>
      </Card>
      <Card>
        <Text style={[styles.item, {color: theme.colors.ink}]}>Theme</Text>
        <View style={styles.row}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map(option => (
            <View key={option} style={styles.flex}>
              <Button
                label={option}
                variant={settings.theme === option ? 'primary' : 'ghost'}
                onPress={() => updateSettings({...settings, theme: option})}
              />
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <Text style={[styles.item, {color: theme.colors.ink}]}>Units</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>kg and cm. Other units can be added later.</Text>
      </Card>
      <Card>
        <Text style={[styles.item, {color: theme.colors.ink}]}>AI keys</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          Keys stay on this phone. They are not shipped inside the APK.
          Voice needs Groq. NVIDIA is the text fallback.
        </Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          Groq: {settings.groqApiKey ? `saved ${maskSecret(settings.groqApiKey)}` : 'not set'}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          NVIDIA: {settings.nvidiaApiKey ? `saved ${maskSecret(settings.nvidiaApiKey)}` : 'not set'}
        </Text>
        <View style={styles.fields}>
          <Input
            label="Groq API key"
            value={groqDraft}
            onChangeText={setGroqDraft}
            placeholder={settings.groqApiKey ? 'Paste a new Groq key to replace' : 'gsk_…'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            secureTextEntry
            textContentType="none"
          />
          <Input
            label="NVIDIA API key"
            value={nvidiaDraft}
            onChangeText={setNvidiaDraft}
            placeholder={settings.nvidiaApiKey ? 'Paste a new NVIDIA key to replace' : 'nvapi-…'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            secureTextEntry
            textContentType="none"
          />
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button label="Save keys" onPress={saveKeys} />
          </View>
          <View style={styles.flex}>
            <Button
              label="Clear keys"
              variant="ghost"
              onPress={() => {
                setGroqDraft('');
                setNvidiaDraft('');
                void updateSettings({...settings, groqApiKey: '', nvidiaApiKey: ''});
              }}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Button
            label="Groq primary"
            variant={settings.primaryProvider === 'groq' ? 'primary' : 'ghost'}
            onPress={() =>
              updateSettings({...settings, primaryProvider: 'groq', fallbackProvider: 'nvidia'})
            }
          />
          <Button
            label="NVIDIA primary"
            variant={settings.primaryProvider === 'nvidia' ? 'primary' : 'ghost'}
            onPress={() =>
              updateSettings({...settings, primaryProvider: 'nvidia', fallbackProvider: 'groq'})
            }
          />
        </View>
        <Button
          label={settings.showLastProvider ? 'Hide last provider' : 'Show last provider'}
          variant="ghost"
          onPress={() => updateSettings({...settings, showLastProvider: !settings.showLastProvider})}
        />
      </Card>
      <Card>
        <Text style={[styles.item, {color: theme.colors.ink}]}>Updates</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          {versionName ? `Installed version ${versionName}` : 'Checking version…'}
          . CutLog looks for a newer APK when you open the app.
        </Text>
        <View style={{marginTop: 12}}>
          <Button
            label="Check for updates"
            variant="secondary"
            onPress={() => {
              void checkForUpdate({silent: false});
            }}
          />
        </View>
      </Card>
      <Text style={[styles.disclaimer, {color: theme.colors.faint}]}>
        Energy expenditure and AI nutrition values are estimates. Keys live in on-device storage, not in the downloadable APK. A rooted phone can still read them.
      </Text>
      <Button label="Developer" variant="ghost" onPress={() => navigation.navigate('Debug')} />
      <Button
        label="Saved foods"
        variant="secondary"
        onPress={() => navigation.navigate('SavedFoods')}
      />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 32, fontWeight: '600', marginBottom: 20},
  stack: {gap: 16},
  item: {fontSize: 16, fontWeight: '600'},
  meta: {fontSize: 13, marginTop: 4, lineHeight: 18},
  row: {flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap'},
  fields: {gap: 12, marginTop: 12},
  flex: {flex: 1, minWidth: 120},
  disclaimer: {fontSize: 13, lineHeight: 19, marginVertical: 4},
});
