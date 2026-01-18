import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import GearIcon from '../components/GearIcon';
import { setupNotificationHandlers } from '../services/notificationService';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import NewChatScreen from '../screens/NewChatScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupInfoScreen from '../screens/GroupInfoScreen';
import AddParticipantsScreen from '../screens/AddParticipantsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { theme } = useTheme();
  const navigationRef = useRef(null);

  // Setup notification handlers when user is authenticated
  useEffect(() => {
    if (isAuthenticated && navigationRef.current) {
      const unsubscribe = setupNotificationHandlers(navigationRef.current);
      return unsubscribe;
    }
  }, [isAuthenticated]);

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (
        // Main App Stack (after login)
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerTintColor: theme.primary,
            headerTitleStyle: {
              color: theme.text,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Conversations"
            component={ConversationsScreen}
            options={({ navigation, route }) => ({
              headerShown: true,
              title: '',
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => {
                    // Call the function passed from ConversationsScreen
                    route.params?.toggleUserMenu?.();
                  }}
                  style={{ marginLeft: 16 }}
                >
                  {user?.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                        {user?.username?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ),
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  style={{ marginRight: 16 }}
                >
                  <GearIcon size={24} color={theme.primary} />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params?.chatName || 'Chat',
              headerBackTitle: 'Back',
            })}
          />
          <Stack.Screen
            name="NewChat"
            component={NewChatScreen}
            options={{
              title: 'New Chat',
              headerBackTitle: 'Cancel',
            }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{
              title: 'Create Group',
              headerBackTitle: 'Cancel',
            }}
          />
          <Stack.Screen
            name="GroupInfo"
            component={GroupInfoScreen}
            options={{
              title: 'Group Info',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="AddParticipants"
            component={AddParticipantsScreen}
            options={{
              title: 'Add Participants',
              headerBackTitle: 'Cancel',
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      ) : (
        // Auth Stack (before login)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
