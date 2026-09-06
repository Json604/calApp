import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider, useApp} from './src/context/AppContext';
import {VoiceProvider} from './src/context/VoiceContext';
import {RootNavigator} from './src/navigation/RootNavigator';

function ThemedApp() {
  const {theme} = useApp();
  return (
    <>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <VoiceProvider>
        <RootNavigator />
      </VoiceProvider>
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
