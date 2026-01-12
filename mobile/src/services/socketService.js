import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_URL } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  // Connect to WebSocket server
  async connect() {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        console.error('No auth token found');
        return false;
      }

      // Create socket connection
      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      // Set up event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error('Socket connection error:', error);
      return false;
    }
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.connected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.emit('error', error);
    });

    // Online users
    this.socket.on('users:online', (users) => {
      this.emit('users:online', users);
    });

    // Message events
    this.socket.on('message:received', (message) => {
      this.emit('message:received', message);
    });

    this.socket.on('message:sent', (message) => {
      this.emit('message:sent', message);
    });

    // Typing indicators
    this.socket.on('typing:user', (data) => {
      this.emit('typing:user', data);
    });

    this.socket.on('typing:stopped', (data) => {
      this.emit('typing:stopped', data);
    });
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Send message
  sendMessage(data) {
    if (this.socket && this.connected) {
      this.socket.emit('message:send', data);
    } else {
      console.error('Socket not connected');
    }
  }

  // Start typing
  startTyping(data) {
    if (this.socket && this.connected) {
      this.socket.emit('typing:start', data);
    }
  }

  // Stop typing
  stopTyping(data) {
    if (this.socket && this.connected) {
      this.socket.emit('typing:stop', data);
    }
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
}

export default new SocketService();
