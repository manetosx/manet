import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ENDPOINTS } from '../config/api';

const GroupInfoScreen = ({ route, navigation }) => {
  const { chatId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();

  const [chat, setChat] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    fetchGroupInfo();
  }, [chatId]);

  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/chats/${chatId}`);
      setChat(response.data.chat);
      setParticipants(response.data.chat.participants || []);
    } catch (error) {
      console.error('Error fetching group info:', error);
      Alert.alert('Error', 'Failed to load group information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipants = () => {
    navigation.navigate('AddParticipants', { chatId, currentParticipants: participants });
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: confirmLeaveGroup,
        },
      ]
    );
  };

  const confirmLeaveGroup = async () => {
    try {
      setLeaving(true);
      await api.delete(`/chats/${chatId}/leave`);
      Alert.alert('Success', 'You have left the group');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Conversations' }],
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      Alert.alert('Error', 'Failed to leave group');
    } finally {
      setLeaving(false);
    }
  };

  const handleRemoveParticipant = (participantId, participantName) => {
    if (chat.admin.toString() !== user._id.toString()) {
      Alert.alert('Error', 'Only group admin can remove participants');
      return;
    }

    Alert.alert(
      'Remove Participant',
      `Remove ${participantName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => confirmRemoveParticipant(participantId),
        },
      ]
    );
  };

  const confirmRemoveParticipant = async (participantId) => {
    try {
      await api.delete(`/chats/${chatId}/participants/${participantId}`);
      Alert.alert('Success', 'Participant removed');
      fetchGroupInfo(); // Refresh the list
    } catch (error) {
      console.error('Error removing participant:', error);
      Alert.alert('Error', 'Failed to remove participant');
    }
  };

  const isAdmin = chat?.admin?.toString() === user?._id?.toString();

  const renderParticipant = ({ item }) => {
    const isCurrentUser = item._id.toString() === user._id.toString();
    const isParticipantAdmin = item._id.toString() === chat?.admin?.toString();

    return (
      <View style={[styles.participantItem, { borderBottomColor: theme.border }]}>
        <View style={styles.participantInfo}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.participantDetails}>
            <View style={styles.nameRow}>
              <Text style={[styles.participantName, { color: theme.text }]}>
                {item.username}
                {isCurrentUser && ' (You)'}
              </Text>
              {isParticipantAdmin && (
                <View style={[styles.adminBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.participantEmail, { color: theme.textSecondary }]}>
              {item.email}
            </Text>
          </View>
        </View>
        {isAdmin && !isCurrentUser && !isParticipantAdmin && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.error || '#FF3B30' }]}
            onPress={() => handleRemoveParticipant(item._id, item.username)}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
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
      {/* Group Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={[styles.groupAvatarLarge, { backgroundColor: theme.primary }]}>
          <Text style={styles.groupAvatarTextLarge}>
            {chat?.name?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
        <Text style={[styles.groupName, { color: theme.text }]}>
          {chat?.name || 'Group Chat'}
        </Text>
        <Text style={[styles.participantCount, { color: theme.textSecondary }]}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Admin Controls */}
      {isAdmin && (
        <View style={[styles.adminSection, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: theme.primary }]}
            onPress={handleAddParticipants}
            activeOpacity={0.8}
          >
            <Text style={styles.adminButtonText}>➕ Add Participants</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Participants List */}
      <View style={styles.participantsSection}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PARTICIPANTS
        </Text>
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item._id}
          style={[styles.participantsList, { backgroundColor: theme.surface }]}
        />
      </View>

      {/* Leave Group Button */}
      <TouchableOpacity
        style={[
          styles.leaveButton,
          { backgroundColor: theme.error || '#FF3B30' },
          leaving && styles.leaveButtonDisabled,
        ]}
        onPress={handleLeaveGroup}
        disabled={leaving}
        activeOpacity={0.8}
      >
        {leaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        )}
      </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  groupAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupAvatarTextLarge: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '600',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  participantCount: {
    fontSize: 16,
  },
  adminSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  adminButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  participantsSection: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  participantsList: {
    flex: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
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
  participantDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  participantEmail: {
    fontSize: 14,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
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
  leaveButtonDisabled: {
    opacity: 0.6,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GroupInfoScreen;
