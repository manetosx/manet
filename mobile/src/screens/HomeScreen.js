import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Welcome to maNet!</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Hello, {user?.username}!
      </Text>

      <View style={[styles.infoBox, { backgroundColor: theme.surface }]}>
        <Text style={[styles.infoText, { color: theme.text }]}>
          Phase 2 Complete!
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Theme system added. Tap the gear icon to switch themes!
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.error }]}
        onPress={logout}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
  },
  infoBox: {
    padding: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
  },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
