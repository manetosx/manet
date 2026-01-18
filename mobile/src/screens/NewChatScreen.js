import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../services/api';
import { ENDPOINTS } from '../config/api';
import { isUserOnline } from '../utils/messageHelpers';

const NewChatScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { onlineUsers } = useWebSocket();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter((u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');

      // Filter out current user
      const allUsers = response.data.users || response.data;
      const otherUsers = allUsers.filter((u) => u._id !== user?._id);

      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (selectedUser) => {
    if (creating) return;

    try {
      setCreating(true);

      // Create or get existing chat
      const response = await api.post(ENDPOINTS.CHATS.CREATE, {
        participantIds: [selectedUser._id],
        isGroupChat: false,
      });

      const chat = response.data.chat;

      // Navigate to chat screen
      navigation.replace('Chat', {
        chatId: chat._id,
        chatName: selectedUser.username,
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat');
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const isOnline = isUserOnline(item._id, onlineUsers);

    return (
      <TouchableOpacity
        style={[styles.userItem, { borderBottomColor: theme.border }]}
        onPress={() => handleUserSelect(item)}
        disabled={creating}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: theme.onlineIndicator }]} />
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
            {item.username}
          </Text>
          {item.status && (
            <Text
              style={[styles.status, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.status}
            </Text>
          )}
        </View>

        {/* Online Status Text */}
        {isOnline && (
          <Text style={[styles.onlineText, { color: theme.onlineIndicator }]}>
            Online
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {searchQuery ? 'No users found' : 'No users available'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.inputText,
              borderColor: theme.inputBorder,
            },
          ]}
          placeholder="Search users..."
          placeholderTextColor={theme.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredUsers.length === 0 && styles.emptyList}
      />

      {/* Creating Indicator */}
      {creating && (
        <View style={styles.creatingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.creatingText, { color: theme.text }]}>
            Creating chat...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 12,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
  },
  onlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  creatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewChatScreen;
