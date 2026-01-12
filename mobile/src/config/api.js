// API Configuration
// Update the BASE_URL based on your environment

// For Android Emulator: Use 10.0.2.2 to access localhost
// For iOS Simulator: Use localhost
// For Physical Device: Use your computer's IP address (e.g., 192.168.1.100)

import { Platform } from 'react-native';

const getBaseURL = () => {
  if (__DEV__) {
    // Development environment
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }
  // Production environment
  return 'https://your-production-api.com/api';
};

export const API_URL = getBaseURL();
export const WS_URL = getBaseURL().replace('/api', '').replace('http', 'ws');

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    GOOGLE_MOBILE: '/auth/google/mobile',
  },
  // Users
  USERS: {
    PROFILE: '/users/profile',
    SEARCH: '/users/search',
    BY_ID: (id) => `/users/${id}`,
  },
  // Chats
  CHATS: {
    LIST: '/chats',
    CREATE: '/chats',
    BY_ID: (id) => `/chats/${id}`,
    ADD_PARTICIPANTS: (id) => `/chats/${id}/participants`,
    LEAVE: (id) => `/chats/${id}/leave`,
  },
  // Messages
  MESSAGES: {
    SEND: '/messages',
    BY_CHAT: (chatId) => `/messages/chat/${chatId}`,
    MARK_READ: (id) => `/messages/${id}/read`,
    DELETE: (id) => `/messages/${id}`,
  },
};

// Request timeout
export const REQUEST_TIMEOUT = 10000;
