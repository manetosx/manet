import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const UserMenu = ({ visible, onClose, onProfilePress, onSettingsPress, onLogoutPress }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menuContainer, { backgroundColor: theme.surface }]}>
          {/* User Info Section */}
          <View style={[styles.userInfoSection, { borderBottomColor: theme.border }]}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.profilePlaceholderText}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={[styles.username, { color: theme.text }]}>
                {user?.username || 'User'}
              </Text>
              <Text style={[styles.email, { color: theme.textSecondary }]}>
                {user?.email || ''}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                onClose();
                onProfilePress();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                onClose();
                onSettingsPress();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={[styles.menuText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onLogoutPress();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, { color: theme.error || '#FF3B30' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingLeft: 16,
  },
  menuContainer: {
    width: 280,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profilePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UserMenu;
