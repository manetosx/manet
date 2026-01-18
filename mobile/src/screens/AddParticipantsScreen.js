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

const AddParticipantsScreen = ({ route, navigation }) => {
  const { chatId, currentParticipants } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the base users endpoint to get all users
      const response = await api.get('/users');

      // Filter out current participants
      const currentParticipantIds = currentParticipants.map(p => p._id);
      const availableUsers = response.data.users.filter(
        u => !currentParticipantIds.includes(u._id)
      );

      setUsers(availableUsers);
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

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    try {
      setAdding(true);
      await api.post(`/chats/${chatId}/participants`, {
        participantIds: selectedUsers,
      });

      Alert.alert('Success', 'Participants added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding participants:', error);
      Alert.alert('Error', 'Failed to add participants');
    } finally {
      setAdding(false);
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
      {/* Selected Count */}
      <View style={[styles.countContainer, { backgroundColor: theme.surface }]}>
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
                {users.length === 0 ? 'All users are already in the group' : 'No users found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: theme.primary },
          adding && styles.addButtonDisabled,
        ]}
        onPress={handleAddParticipants}
        disabled={adding}
        activeOpacity={0.8}
      >
        {adding ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.addButtonText}>Add Participants</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  countContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedCount: {
    fontSize: 14,
    paddingHorizontal: 4,
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
  addButton: {
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
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddParticipantsScreen;
