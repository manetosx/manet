import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import { registerForPushNotifications } from '../services/notificationService';
import { configureGoogleSignIn, signInWithGoogle, signOutFromGoogle } from '../services/googleAuthService';

// Web Client ID from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = '896235621488-eps5s9pc4ilab0kfgbhfvnmu5899p2ai.apps.googleusercontent.com';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure Google Sign-In and check auth status on app start
  useEffect(() => {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      const token = await authService.getStoredToken();

      if (storedUser && token) {
        setUser(storedUser);
        setIsAuthenticated(true);
        // Register for push notifications after authentication is confirmed
        registerForPushNotifications();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        // Register for push notifications after successful login
        registerForPushNotifications();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const result = await authService.register(username, email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        // Register for push notifications after successful registration
        registerForPushNotifications();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const googleSignIn = async () => {
    try {
      // Use the Google Sign-In service which handles everything
      const result = await signInWithGoogle();

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        // Store auth data
        await authService.storeAuthData(result.token, result.user);
        // Register for push notifications after successful Google sign-in
        registerForPushNotifications();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Also sign out from Google if signed in
      await signOutFromGoogle();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        googleSignIn,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
