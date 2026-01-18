/**
 * maNet - Real-time Messaging App
 * Phase 3: Core Messaging Features
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar barStyle={theme.statusBar} />
      <AppNavigator />
    </>
  );
}

function App() {
  // Suppress InteractionManager deprecation warning from dependencies
  useEffect(() => {
    LogBox.ignoreLogs([
      'InteractionManager has been deprecated',
    ]);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <AppContent />
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
