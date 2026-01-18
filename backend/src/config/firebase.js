const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  try {
    // Check if Firebase credentials are configured
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.log('⚠️  Firebase credentials not configured. Push notifications will be unavailable.');
      return false;
    }

    // Initialize Firebase Admin with service account
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return false;
  }
};

const sendNotification = async (token, payload) => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'messages'
        }
      }
    };

    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending notification:', error.message);
    return { success: false, error: error.message };
  }
};

const sendMulticastNotification = async (tokens, payload) => {
  if (!firebaseInitialized || !tokens || tokens.length === 0) {
    return { success: false, error: 'Firebase not initialized or no tokens provided' };
  }

  try {
    const message = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'messages'
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending multicast notification:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  sendNotification,
  sendMulticastNotification,
  isInitialized: () => firebaseInitialized
};
