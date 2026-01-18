import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { API_URL, ENDPOINTS } from '../config/api';

// Initialize Google Sign-In
// Web Client ID is required - get it from Google Cloud Console
export const configureGoogleSignIn = (webClientId) => {
  GoogleSignin.configure({
    webClientId: webClientId,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in and get user info
    const signInResult = await GoogleSignin.signIn();

    // Get the ID token
    const idToken = signInResult?.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Send the ID token to our backend
    const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.GOOGLE_MOBILE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google authentication failed');
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);

    let errorMessage = 'Google Sign-In failed';

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      errorMessage = 'Sign-in was cancelled';
    } else if (error.code === statusCodes.IN_PROGRESS) {
      errorMessage = 'Sign-in is already in progress';
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      errorMessage = 'Google Play Services not available';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Sign out from Google
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    return { success: true };
  } catch (error) {
    console.error('Google Sign-Out error:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is signed in with Google
export const isGoogleSignedIn = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    return isSignedIn;
  } catch (error) {
    console.error('Check Google Sign-In error:', error);
    return false;
  }
};

// Get current Google user
export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo;
  } catch (error) {
    console.error('Get current Google user error:', error);
    return null;
  }
};
