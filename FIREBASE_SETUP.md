# Firebase Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in the maNet app.

## Prerequisites

- A Google account
- Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter project name (e.g., "maNet")
4. Accept terms and click "Continue"
5. Disable Google Analytics (optional) and click "Create project"

## Step 2: Add Android App to Firebase Project

1. In your Firebase project dashboard, click the Android icon to add an Android app
2. Enter the following details:
   - **Android package name**: `com.manet` (must match your app's package name)
   - **App nickname**: maNet (optional)
   - **Debug signing certificate SHA-1**: Leave empty for now (optional)
3. Click "Register app"
4. Download the `google-services.json` file
5. Replace the placeholder file at `mobile/android/app/google-services.json` with the downloaded file

## Step 3: Get Firebase Admin SDK Credentials (Backend)

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" to download a JSON file
6. Open the downloaded JSON file and extract the following values:
   - `project_id`
   - `private_key`
   - `client_email`

## Step 4: Configure Backend Environment Variables

Add the following environment variables to your `backend/.env` file:

```env
# Firebase Configuration for Push Notifications
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**Important Notes:**
- Replace the values with the ones from your downloaded JSON file
- Keep the private key in quotes and preserve the `\n` line breaks
- Never commit your `.env` file to version control

## Step 5: Enable Firebase Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Library"
4. Search for "Firebase Cloud Messaging API"
5. Click on it and click "Enable"

## Step 6: Test the Setup

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

   You should see: `✅ Firebase Admin initialized`

2. **Build and install the mobile app:**
   ```bash
   cd mobile
   npx react-native run-android
   ```

3. **Test notifications:**
   - Log in to the app on two devices
   - Send a message from one device to another
   - The second device should receive a push notification

## How It Works

### Mobile App (Frontend)
- Requests notification permission on app startup
- Gets FCM token from Firebase
- Sends token to backend via API
- Listens for incoming notifications
- Handles notification taps to navigate to chat

### Backend
- Stores FCM tokens in user documents
- When a message is sent:
  - Checks if recipients are online (WebSocket)
  - If offline or not in chat, sends push notification
  - Respects mute settings (doesn't send if chat is muted)

### Notification Flow
1. User A sends message to User B
2. Backend checks if User B is online and in the chat
3. If User B is offline or not viewing the chat:
   - Backend retrieves User B's FCM token
   - Checks if chat is muted for User B
   - If not muted, sends push notification via Firebase
4. User B receives notification on their device
5. Tapping notification opens the app to the chat

## Mute Functionality

Users can mute conversations for:
- 1 hour
- 2 hours
- 8 hours
- Until manually unmuted

Muted chats will not send push notifications to the user.

## Troubleshooting

### "Firebase not initialized" message
- Check that your `.env` file has the correct Firebase credentials
- Ensure the backend server was restarted after adding credentials

### No notifications received
1. Check notification permission is granted on the device
2. Verify FCM token is being sent to backend (check logs)
3. Ensure Firebase Cloud Messaging API is enabled in Google Cloud Console
4. Check that the sending user's device has internet connection
5. Verify the receiving user is not currently in the chat (notifications only sent when offline/away)

### Invalid credentials error
- Double-check the private key format in `.env`
- Ensure `\n` line breaks are preserved in the private key
- Verify project_id matches your Firebase project

## Security Notes

- **Never** commit `google-services.json` or `.env` files to version control
- Add them to `.gitignore`:
  ```
  # Firebase
  mobile/android/app/google-services.json
  backend/.env
  ```
- Rotate service account keys periodically
- Use different Firebase projects for development and production

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
