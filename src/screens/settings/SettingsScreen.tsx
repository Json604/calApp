import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {aiEnv} from '../../config/env';
import {useApp} from '../../context/AppContext';
import type {RootStackParamList} from '../../navigation/types';
import type {ThemePreference} from '../../types';
import {checkForUpdate, currentVersion} from '../../update/updateChecker';

export function SettingsScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const {theme, settings, updateSettings, profile, goal} = useApp();
  const [versionName, setVersionName] = useState('');
  useEffect(() => {
    void currentVersion().then(setVersionName);
  }, []);
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
        <Text style={[styles.item, {color: theme.colors.ink}]}>AI</Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          Primary {settings.primaryProvider} · Fallback {settings.fallbackProvider}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          Groq configured: {aiEnv.groqApiKey ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.meta, {color: theme.colors.muted}]}>
          NVIDIA configured: {aiEnv.nvidiaApiKey ? 'Yes' : 'No'}
        </Text>
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
        Energy expenditure and AI nutrition values are estimates. API keys in a mobile app are not secure; a public version should proxy Groq/NVIDIA through a backend.
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
  flex: {flex: 1, minWidth: 120},
  disclaimer: {fontSize: 13, lineHeight: 19, marginVertical: 4},
});
