import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../config/api';

class AuthService {
  // Register new user
  async register(username, email, password) {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REGISTER, {
        username,
        email,
        password,
      });

      const { token, user } = response.data;

      // Store auth data
      await this.storeAuthData(token, user);

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Store auth data
      await this.storeAuthData(token, user);

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Google Sign-In (mobile)
  async googleSignIn(idToken) {
    try {
      const response = await api.post(ENDPOINTS.AUTH.GOOGLE_MOBILE, {
        idToken,
      });

      const { token, user } = response.data;

      // Store auth data
      await this.storeAuthData(token, user);

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless
      await this.clearAuthData();
    }
  }

  // Store authentication data
  async storeAuthData(token, user) {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  // Clear authentication data
  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove(['authToken', 'user']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Get stored user data
  async getStoredUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  // Get stored auth token
  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error reading auth token:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getStoredToken();
    return !!token;
  }
}

export default new AuthService();
