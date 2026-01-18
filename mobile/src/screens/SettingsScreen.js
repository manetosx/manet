import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL, ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const { theme, themeMode, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your messages and data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // For Google users, delete directly; for others, ask for password
            if (user?.googleId) {
              confirmDeleteAccount();
            } else {
              setShowDeleteModal(true);
            }
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async (password = null) => {
    setDeleteLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = `${API_URL}${ENDPOINTS.USERS.DELETE_ACCOUNT}`;
      console.log('Delete account URL:', url);
      console.log('Token exists:', !!token);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      console.log('Response status:', response.status);

      // Get raw text first to debug HTML responses
      const text = await response.text();
      console.log('Response text:', text.substring(0, 200));

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        Alert.alert('Error', 'Server returned an invalid response. Please try again.');
        setDeleteLoading(false);
        return;
      }

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Failed to delete account');
        setDeleteLoading(false);
        return;
      }

      setShowDeleteModal(false);
      setDeletePassword('');
      await logout();
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const themeOptions = [
    { value: 'system', label: 'System Default', description: 'Follow system settings' },
    { value: 'light', label: 'Light Mode', description: 'Always use light theme' },
    { value: 'dark', label: 'Dark Mode', description: 'Always use dark theme' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Appearance
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Choose how maNet looks on your device
        </Text>

        <View style={[styles.optionsContainer, { backgroundColor: theme.surface }]}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                index !== themeOptions.length - 1 && styles.optionBorder,
                { borderBottomColor: theme.border },
              ]}
              onPress={() => setTheme(option.value)}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: theme.border },
                  themeMode === option.value && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                {themeMode === option.value && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          About
        </Text>
        <View style={[styles.infoContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Version
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              1.0.0
            </Text>
          </View>
          <View style={[styles.infoRow, styles.infoBorder, { borderTopColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Phase
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              Phase 3 Complete
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.error }]}>
          Danger Zone
        </Text>
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: theme.error }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Text style={[styles.deleteButtonText, { color: theme.error }]}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={[styles.deleteWarning, { color: theme.textSecondary }]}>
          This will permanently delete your account and all associated data.
        </Text>
      </View>

      {/* Password confirmation modal for non-Google users */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Confirm Deletion
            </Text>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Enter your password to confirm account deletion.
            </Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              }]}
              placeholder="Password"
              placeholderTextColor={theme.inputPlaceholder}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              editable={!deleteLoading}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                disabled={deleteLoading}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton, { backgroundColor: theme.error }]}
                onPress={() => confirmDeleteAccount(deletePassword)}
                disabled={deleteLoading || !deletePassword}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionBorder: {
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  infoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  infoBorder: {
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalDeleteButton: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
