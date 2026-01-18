import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState(user?.status || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || '');
  const [updating, setUpdating] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.put('/users/profile', {
        username: username.trim(),
        status: status.trim(),
        profilePicture: profilePictureUrl.trim(),
      });

      // Update local user state and storage
      const updatedUserData = response.data.user;
      if (updateUser) {
        updateUser(updatedUserData);
      }

      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleSelectPhoto = () => {
    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: true,
    };

    launchCamera(options, handleImageResponse);
  };

  const handleChooseFromLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: true,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', 'Failed to pick image');
    } else if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      // Convert to base64 data URI
      const base64Image = `data:${asset.type};base64,${asset.base64}`;
      setProfilePictureUrl(base64Image);
    }
  };

  const handleRemoveProfilePicture = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setProfilePictureUrl(''),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Picture Section */}
      <View style={styles.profileSection}>
        {profilePictureUrl ? (
          <TouchableOpacity
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: profilePictureUrl }} style={styles.profileImage} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.profilePlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={styles.profilePlaceholderText}>
              {username.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.changePhotoButton, { backgroundColor: theme.primary }]}
          onPress={handleSelectPhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.changePhotoText}>
            {profilePictureUrl ? 'Change Photo' : 'Add Photo'}
          </Text>
        </TouchableOpacity>

        {profilePictureUrl && (
          <TouchableOpacity
            style={[styles.removePhotoButton, { borderColor: theme.error || '#FF3B30' }]}
            onPress={handleRemoveProfilePicture}
            activeOpacity={0.8}
          >
            <Text style={[styles.removePhotoText, { color: theme.error || '#FF3B30' }]}>
              Remove Photo
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Form Section */}
      <View style={[styles.formSection, { backgroundColor: theme.surface }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.inputText,
                borderColor: theme.inputBorder,
              },
            ]}
            placeholder="Enter your username"
            placeholderTextColor={theme.inputPlaceholder}
            value={username}
            onChangeText={setUsername}
            maxLength={30}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Status</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.inputText,
                borderColor: theme.inputBorder,
              },
            ]}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.inputPlaceholder}
            value={status}
            onChangeText={setStatus}
            maxLength={100}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              styles.inputDisabled,
              {
                backgroundColor: theme.inputBackground,
                color: theme.textSecondary,
                borderColor: theme.inputBorder,
              },
            ]}
            value={user?.email || ''}
            editable={false}
          />
          <Text style={[styles.helperText, { color: theme.textTertiary }]}>
            Email cannot be changed
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: theme.primary },
          updating && styles.saveButtonDisabled,
        ]}
        onPress={handleUpdateProfile}
        disabled={updating}
        activeOpacity={0.8}
      >
        {updating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      {/* Full-size Image Modal */}
      {profilePictureUrl && (
        <Modal
          visible={imageModalVisible}
          transparent={true}
          onRequestClose={() => setImageModalVisible(false)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setImageModalVisible(false)}
            >
              <Image
                source={{ uri: profilePictureUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '600',
  },
  changePhotoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removePhotoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  removePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});

export default ProfileScreen;
