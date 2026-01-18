import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import authService from '../services/authService';

const WebSocketContext = createContext({});

// Get WebSocket URL - should match the API base URL
const getWebSocketURL = () => {
  if (__DEV__) {
    // Development: use same IP as API
    if (Platform.OS === 'android') {
      return 'http://192.168.0.53:3000';
    }
    return 'http://localhost:3000';
  }
  return 'https://your-production-api.com';
};

const WS_URL = getWebSocketURL();

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [lastTypingEvent, setLastTypingEvent] = useState(null);
  const [lastReadEvent, setLastReadEvent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const connectSocket = async () => {
      if (isAuthenticated && !socketRef.current) {
        try {
          const token = await authService.getStoredToken();

          if (!token) {
            console.warn('No auth token found for WebSocket connection');
            return;
          }

          console.log('Connecting to WebSocket:', WS_URL);

          const newSocket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
          });

          // Connection event handlers
          newSocket.on('connect', () => {
            console.log('✅ WebSocket connected - Socket ID:', newSocket.id);
            setIsConnected(true);
          });

          newSocket.on('disconnect', (reason) => {
            console.log('⚠️ WebSocket disconnected:', reason);
            setIsConnected(false);
          });

          newSocket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error.message);
            setIsConnected(false);
          });

          newSocket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
          });

          newSocket.on('reconnect_error', (error) => {
            console.error('❌ WebSocket reconnection error:', error.message);
          });

          newSocket.on('reconnect_failed', () => {
            console.error('❌ WebSocket reconnection failed after max attempts');
          });

          // Listen for online users
          newSocket.on('users:online', (users) => {
            console.log('📡 Online users updated:', users.length);
            setOnlineUsers(users);
          });

          // Listen for messages - set state instead of relying on external listeners
          newSocket.on('message:received', (message) => {
            console.log('📨 WebSocket received message:', message._id);
            setLastMessage({ ...message, _receivedAt: Date.now() });
          });

          // Listen for typing events
          newSocket.on('typing:user', (data) => {
            console.log('⌨️ Typing started:', data.userId);
            setLastTypingEvent({ ...data, typing: true, _receivedAt: Date.now() });
          });

          newSocket.on('typing:stopped', (data) => {
            console.log('⌨️ Typing stopped:', data.userId);
            setLastTypingEvent({ ...data, typing: false, _receivedAt: Date.now() });
          });

          // Listen for read receipts
          newSocket.on('message:read', (data) => {
            console.log('👁️ Message read:', data.messageId);
            setLastReadEvent({ ...data, _receivedAt: Date.now() });
          });

          socketRef.current = newSocket;
        } catch (error) {
          console.error('Error setting up WebSocket:', error);
        }
      }
    };

    connectSocket();

    // Cleanup on unmount or logout
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting WebSocket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
    };
  }, [isAuthenticated]);

  // Helper function to emit events
  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit "${event}": Socket not connected`);
    }
  }, []);

  const value = {
    isConnected,
    onlineUsers,
    lastMessage,
    lastTypingEvent,
    lastReadEvent,
    emit,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
