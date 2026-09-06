import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider, useApp} from './src/context/AppContext';
import {VoiceProvider} from './src/context/VoiceContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {
  checkForUpdate,
  subscribeToUpdateProgress,
  type UpdateProgress,
} from './src/update/updateChecker';

function ThemedApp() {
  const {theme} = useApp();
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress>({
    status: 'idle',
  });

  useEffect(() => subscribeToUpdateProgress(setUpdateProgress), []);

  useEffect(() => {
    void checkForUpdate();
    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          void checkForUpdate();
        }
      },
    );
    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <VoiceProvider>
        <RootNavigator />
      </VoiceProvider>
      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent
        visible={updateProgress.status === 'downloading'}>
        <View style={styles.updateBackdrop}>
          <View
            style={[
              styles.updateCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.line,
              },
            ]}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text style={[styles.updateTitle, {color: theme.colors.ink}]}>
              Preparing update
            </Text>
            <Text style={[styles.updateMessage, {color: theme.colors.muted}]}>
              {updateProgress.status === 'downloading'
                ? `Downloading and verifying version ${updateProgress.versionName}…`
                : 'Downloading and verifying…'}
            </Text>
            <Text style={[styles.updateHint, {color: theme.colors.faint}]}>
              Android's installer will open automatically.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemedApp />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  updateBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: 'rgba(28,25,20,0.72)',
  },
  updateCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
  },
  updateTitle: {
    fontSize: 19,
    fontWeight: '600',
    marginTop: 16,
  },
  updateMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  updateHint: {
    fontSize: 12,
    marginTop: 10,
  },
});
