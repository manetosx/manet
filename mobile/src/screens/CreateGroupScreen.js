import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ENDPOINTS } from '../config/api';

const CreateGroupScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the base users endpoint to get all users
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length < 1) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/chats', {
        participantIds: selectedUsers,
        isGroupChat: true,
        name: groupName.trim(),
      });

      Alert.alert('Success', 'Group created successfully');
      navigation.navigate('Chat', {
        chatId: response.data.chat._id,
        chatName: response.data.chat.name,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUsers.includes(item._id);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          { borderBottomColor: theme.border },
          isSelected && { backgroundColor: theme.primaryLight || theme.surface },
        ]}
        onPress={() => toggleUserSelection(item._id)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>
            {item.username}
          </Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>
            {item.email}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Group Name Input */}
      <View style={[styles.groupNameContainer, { backgroundColor: theme.surface }]}>
        <TextInput
          style={[
            styles.groupNameInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.inputText,
              borderColor: theme.inputBorder,
            },
          ]}
          placeholder="Group Name"
          placeholderTextColor={theme.inputPlaceholder}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
        <Text style={[styles.selectedCount, { color: theme.textSecondary }]}>
          {selectedUsers.length} participant{selectedUsers.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {/* Search Input */}
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No users found
              </Text>
            </View>
          }
        />
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={[
          styles.createButton,
          { backgroundColor: theme.primary },
          creating && styles.createButtonDisabled,
        ]}
        onPress={handleCreateGroup}
        disabled={creating}
        activeOpacity={0.8}
      >
        {creating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>Create Group</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groupNameContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  groupNameInput: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 14,
    paddingHorizontal: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  createButton: {
    margin: 16,
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
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateGroupScreen;
