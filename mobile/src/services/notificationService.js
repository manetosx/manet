import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import api from './api';
import { ENDPOINTS } from '../config/api';

/**
 * Request notification permission (Android 13+)
 */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

/**
 * Get FCM token and send to backend
 */
export const registerForPushNotifications = async () => {
  try {
    console.log('🔔 Starting push notification registration...');

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('❌ Notification permission denied');
      return null;
    }
    console.log('✅ Notification permission granted');

    // Get FCM token
    console.log('📱 Requesting FCM token...');
    const token = await messaging().getToken();
    if (token) {
      console.log('✅ FCM token received:', token.substring(0, 20) + '...');

      // Send token to backend
      console.log('📤 Sending FCM token to backend...');
      await api.put(ENDPOINTS.USERS.UPDATE_FCM_TOKEN, { fcmToken: token });
      console.log('✅ FCM token registered successfully with backend');
      return token;
    } else {
      console.log('❌ No FCM token received');
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Setup notification handlers
 */
export const setupNotificationHandlers = (navigation) => {
  console.log('🔔 Setting up notification handlers');

  // Handle notification when app is in foreground
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('📨 Foreground notification received:', remoteMessage);
    // Notification is automatically displayed by Firebase
  });

  // Handle notification when app is in background and user taps on it
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('👆 Background notification tapped:', remoteMessage);
    handleNotificationTap(remoteMessage, navigation);
  });

  // Handle notification when app was opened from quit state
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('🚀 Quit state notification tapped:', remoteMessage);
        handleNotificationTap(remoteMessage, navigation);
      }
    });

  // Handle token refresh
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
    console.log('🔄 FCM token refreshed:', token.substring(0, 20) + '...');
    await api.put(ENDPOINTS.USERS.UPDATE_FCM_TOKEN, { fcmToken: token });
  });

  console.log('✅ Notification handlers set up successfully');

  return () => {
    unsubscribeForeground();
    unsubscribeTokenRefresh();
  };
};

/**
 * Handle notification tap - navigate to chat
 */
const handleNotificationTap = (remoteMessage, navigation) => {
  if (remoteMessage?.data?.type === 'message') {
    const { chatId, senderId, senderName } = remoteMessage.data;

    if (chatId && navigation) {
      navigation.navigate('Chat', {
        chatId,
        otherUser: {
          _id: senderId,
          username: senderName
        }
      });
    }
  }
};

export default {
  requestNotificationPermission,
  registerForPushNotifications,
  setupNotificationHandlers
};
