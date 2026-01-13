/**
 * maNet - Real-time Messaging App
 * Phase 2: Mobile App Foundation
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Suppress InteractionManager deprecation warning from dependencies
  useEffect(() => {
    LogBox.ignoreLogs([
      'InteractionManager has been deprecated',
    ]);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
