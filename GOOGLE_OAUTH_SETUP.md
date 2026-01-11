# Google OAuth Setup Guide

Complete guide to setting up Google Sign-In for both backend and React Native mobile app.

## Part 1: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: **maNet** (or your preference)
4. Click "Create"
5. Wait for project creation, then select it

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click **Create**

4. Fill in App Information:
   - App name: **maNet**
   - User support email: **your email**
   - App logo: (optional for testing)
   - Developer contact: **your email**

5. Scopes:
   - Click "Add or Remove Scopes"
   - Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update"

6. Test Users (for development):
   - Add your email and any testers' emails
   - Click "Save and Continue"

7. Click "Back to Dashboard"

### Step 3: Create OAuth 2.0 Credentials

You need to create **three** OAuth clients:
1. Web client (for backend)
2. Android client (for React Native Android)
3. iOS client (for React Native iOS)

#### A. Web Client (Backend)

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: **Messenger Backend**
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - (Add production URL later: `https://yourapp.com/api/auth/google/callback`)
6. Click **Create**
7. **Copy the Client ID and Client Secret** → Save for backend `.env`

#### B. Android Client (React Native)

1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Android**
3. Name: **Messenger Android**
4. Package name: `com.maNetapp` (check your `android/app/build.gradle`)
5. SHA-1 certificate fingerprint:

   **For development, get SHA-1:**
   ```bash
   cd mobile/android
   # On Windows (Git Bash):
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # On macOS/Linux:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   Copy the SHA-1 fingerprint (looks like: `A1:B2:C3:...`)

6. Paste SHA-1 into the form
7. Click **Create**
8. **Copy the Client ID** → Save for React Native config

#### C. iOS Client (React Native)

1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **iOS**
3. Name: **Messenger iOS**
4. Bundle ID: `com.maNetapp` (check your `ios/maNet/Info.plist`)
5. Click **Create**
6. **Copy the Client ID** → Save for React Native config

### Step 4: Enable Google+ API (if not already enabled)

1. Go to **APIs & Services** → **Library**
2. Search for "**Google+ API**"
3. Click on it and press **Enable**

## Part 2: Backend Configuration

### Update `.env` file

Open `backend/.env` and update:

```env
GOOGLE_CLIENT_ID=your_web_client_id_from_step_3A
GOOGLE_CLIENT_SECRET=your_web_client_secret_from_step_3A
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Restart Backend Server

The server will auto-restart if using `npm run dev`, or manually restart:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 3000
📡 WebSocket server ready
```

(Not the warning about Google credentials)

## Part 3: React Native Mobile Setup

### Step 1: Install Google Sign-In Package

```bash
cd mobile
npm install @react-native-google-signin/google-signin
```

### Step 2: Configure Android

1. **Update `android/build.gradle`:**
   ```gradle
   buildscript {
       ext {
           buildToolsVersion = "34.0.0"
           minSdkVersion = 21
           compileSdkVersion = 34
           targetSdkVersion = 34
           ndkVersion = "26.1.10909125"
           kotlinVersion = "1.9.22"

           // Add this:
           googlePlayServicesAuthVersion = "21.0.0"
       }
       // ... rest of file
   }
   ```

2. **Verify package name in `android/app/build.gradle`:**
   ```gradle
   android {
       defaultConfig {
           applicationId "com.maNetapp"  // Should match Google Console
           // ...
       }
   }
   ```

3. **Rebuild Android app:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

### Step 3: Configure iOS

1. **Install pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Update `ios/maNet/Info.plist`:**

   Add before the final `</dict>`:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID_REVERSED</string>
       </array>
     </dict>
   </array>
   ```

   Replace `YOUR_IOS_CLIENT_ID_REVERSED` with your iOS Client ID reversed.

   Example: If iOS Client ID is `123456-abc.apps.googleusercontent.com`
   Use: `com.googleusercontent.apps.123456-abc`

3. **Verify Bundle Identifier in Xcode:**
   - Open `ios/maNet.xcworkspace` in Xcode
   - Select the project → Target → General
   - Verify Bundle Identifier matches Google Console: `com.maNetapp`

### Step 4: Create Google Sign-In Configuration

Create `mobile/src/config/googleSignIn.js`:

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID_FROM_BACKEND', // From Step 3A
  iosClientId: 'YOUR_IOS_CLIENT_ID', // From Step 3C (iOS only)
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export default GoogleSignin;
```

### Step 5: Implement Google Sign-In

Example usage in your Auth screen:

```javascript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import GoogleSignin from '../config/googleSignIn';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Update for production

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token
      const { idToken } = await GoogleSignin.getTokens();

      // Send ID token to your backend
      const response = await axios.post(`${API_URL}/auth/google/mobile`, {
        idToken: idToken,
      });

      const { token, user } = response.data;

      // Save token (use AsyncStorage)
      // await AsyncStorage.setItem('authToken', token);

      console.log('Logged in as:', user.username);
      Alert.alert('Success', `Welcome ${user.username}!`);

      // Navigate to main app

    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title={loading ? 'Signing in...' : 'Sign in with Google'}
        onPress={handleGoogleSignIn}
        disabled={loading}
      />
    </View>
  );
}
```

## Testing

### Test Backend OAuth (Web Flow)

1. Open browser: `http://localhost:3000/api/auth/google`
2. Sign in with Google
3. Should redirect back with token (or error if redirect URL not configured)

### Test Mobile App

1. Run the app:
   ```bash
   npm run android
   # or
   npm run ios
   ```

2. Tap "Sign in with Google"
3. Select Google account
4. Should log you in and return user data

## Common Issues & Solutions

### Issue: "Error 10" on Android
**Solution:** SHA-1 fingerprint mismatch
- Regenerate SHA-1: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
- Update in Google Console

### Issue: "DEVELOPER_ERROR" on Android
**Solution:** Package name or SHA-1 incorrect
- Verify `applicationId` in `android/app/build.gradle`
- Verify SHA-1 in Google Console

### Issue: iOS Google Sign-In crashes
**Solution:** URL Scheme not configured
- Check `Info.plist` has correct reversed client ID
- Rebuild: `cd ios && pod install && cd ..`

### Issue: "Redirect URI mismatch"
**Solution:** Backend redirect URL not authorized
- Add exact URL to Google Console Authorized Redirect URIs
- Include `http://localhost:3000/api/auth/google/callback`

### Issue: Can't connect to backend from emulator
**Solution:** Update API URL
- Android emulator: Use `http://10.0.2.2:3000/api`
- iOS simulator: Use `http://localhost:3000/api`
- Physical device: Use computer's IP (e.g., `http://192.168.1.100:3000/api`)

## Production Deployment

When deploying to production:

1. **Create Production OAuth Clients** in Google Console
2. **Add production URLs** to authorized redirect URIs:
   - Backend: `https://api.yourapp.com/api/auth/google/callback`
3. **Update environment variables** with production credentials
4. **For mobile releases:**
   - Android: Generate release keystore, get its SHA-1
   - iOS: Use production bundle identifier
5. **Update mobile config** to use production API URL

## Summary Checklist

Backend:
- [ ] Created Google Cloud Project
- [ ] Configured OAuth consent screen
- [ ] Created Web OAuth Client
- [ ] Updated `backend/.env` with credentials
- [ ] Backend server running without Google warnings

Android:
- [ ] Created Android OAuth Client
- [ ] Added SHA-1 fingerprint
- [ ] Installed Google Sign-In package
- [ ] Configured package name
- [ ] Added web client ID to config

iOS:
- [ ] Created iOS OAuth Client
- [ ] Configured bundle identifier
- [ ] Added URL scheme to Info.plist
- [ ] Installed pods
- [ ] Added client IDs to config

Testing:
- [ ] Tested web OAuth flow
- [ ] Tested Android Google Sign-In
- [ ] Tested iOS Google Sign-In
- [ ] Backend successfully creates/logs in users

---

**Need Help?**
- Google Sign-In Docs: https://github.com/react-native-google-signin/google-signin
- Google Cloud Console: https://console.cloud.google.com/
- Stack Overflow: Search for specific error codes

**Security Note:**
Never commit your `.env` file or expose client secrets publicly!
