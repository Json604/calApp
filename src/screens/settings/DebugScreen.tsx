import React, {useEffect, useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {Card} from '../../components/Card';
import {Screen} from '../../components/Screen';
import {aiEnv} from '../../config/env';
import {STORAGE_SCHEMA_VERSION} from '../../constants/energy';
import {useApp} from '../../context/AppContext';
import {getAiDebugState} from '../../services/ai';
import {currentVersion} from '../../update/updateChecker';

export function DebugScreen() {
  const {theme, settings} = useApp();
  const debug = getAiDebugState();
  const [versionName, setVersionName] = useState('');
  useEffect(() => {
    void currentVersion().then(setVersionName);
  }, []);
  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.ink}]}>Developer</Text>
      <Card>
        <Line label="App version" value={versionName || '—'} />
        <Line label="Storage schema" value={String(STORAGE_SCHEMA_VERSION)} />
        <Line label="Primary" value={settings.primaryProvider} />
        <Line label="Fallback" value={settings.fallbackProvider} />
        <Line label="Groq text model" value={settings.groqTextModel} />
        <Line label="NVIDIA text model" value={settings.nvidiaTextModel} />
        <Line label="Transcription model" value={settings.transcriptionModel} />
        <Line label="Groq key present" value={aiEnv.groqApiKey ? 'yes' : 'no'} />
        <Line label="NVIDIA key present" value={aiEnv.nvidiaApiKey ? 'yes' : 'no'} />
        <Line label="Last provider" value={debug.lastProvider ?? '—'} />
        <Line label="Last latency" value={debug.lastLatencyMs ? `${debug.lastLatencyMs} ms` : '—'} />
        <Line label="Last intent" value={debug.lastIntent ?? '—'} />
        <Line label="Last error" value={debug.lastError ?? '—'} />
      </Card>
      <Text style={{color: theme.colors.faint, marginTop: 12}}>
        API keys are never shown here.
      </Text>
    </Screen>
  );
}

function Line({label, value}: {label: string; value: string}) {
  const {theme} = useApp();
  return (
    <Text style={{color: theme.colors.ink, marginBottom: 8}}>
      {label}: {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 28, fontWeight: '600', marginBottom: 16},
});
