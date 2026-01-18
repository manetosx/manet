import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Color definitions
const lightTheme = {
  // Background colors
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',

  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0051D5',

  // Status colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',

  // Border colors
  border: '#E5E5E5',
  borderDark: '#CCCCCC',

  // Input colors
  inputBackground: '#F5F5F5',
  inputBorder: '#E5E5E5',
  inputText: '#000000',
  inputPlaceholder: '#999999',

  // Button colors
  buttonPrimary: '#007AFF',
  buttonSecondary: '#FFFFFF',
  buttonDanger: '#FF3B30',

  // Message bubble colors
  messageSent: '#007AFF',
  messageReceived: '#E5E5E5',
  messageSentText: '#FFFFFF',
  messageReceivedText: '#000000',

  // Messaging UI colors
  timestamp: '#8E8E93',
  unreadBadge: '#FF3B30',
  onlineIndicator: '#34C759',
  typingIndicator: '#007AFF',

  // Status bar
  statusBar: 'dark-content',
};

const darkTheme = {
  // Background colors
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#ABABAB',
  textTertiary: '#8E8E93',

  // Primary colors
  primary: '#0A84FF',
  primaryDark: '#0066CC',

  // Status colors
  success: '#32D74B',
  error: '#FF453A',
  warning: '#FF9F0A',

  // Border colors
  border: '#38383A',
  borderDark: '#48484A',

  // Input colors
  inputBackground: '#1C1C1E',
  inputBorder: '#38383A',
  inputText: '#FFFFFF',
  inputPlaceholder: '#8E8E93',

  // Button colors
  buttonPrimary: '#0A84FF',
  buttonSecondary: '#2C2C2E',
  buttonDanger: '#FF453A',

  // Message bubble colors
  messageSent: '#0A84FF',
  messageReceived: '#2C2C2E',
  messageSentText: '#FFFFFF',
  messageReceivedText: '#FFFFFF',

  // Messaging UI colors
  timestamp: '#8E8E93',
  unreadBadge: '#FF453A',
  onlineIndicator: '#32D74B',
  typingIndicator: '#0A84FF',

  // Status bar
  statusBar: 'light-content',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', or 'system'
  const [isLoading, setIsLoading] = useState(true);

  // Determine current theme based on mode
  const getTheme = () => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getTheme();
  const isDark = theme === darkTheme;

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setTheme,
        isDark,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
