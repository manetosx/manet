import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import {
  getChatName,
  getChatProfilePicture,
  getOtherParticipant,
  isUserOnline,
  getMessagePreview,
} from '../utils/messageHelpers';
import { formatConversationTime } from '../utils/dateFormatter';

const ConversationItem = ({ chat, onPress, onLongPress }) => {
  const { theme } = useTheme();
  const { onlineUsers } = useWebSocket();
  const { user } = useAuth();

  const chatName = getChatName(chat, user?._id);
  const isPinned = chat.pinnedBy?.some(id => id.toString() === user?._id?.toString());
  const profilePicture = getChatProfilePicture(chat, user?._id);
  const lastMessagePreview = getMessagePreview(chat.lastMessage, user?._id);
  const timestamp = formatConversationTime(chat.lastMessage?.createdAt || chat.updatedAt);

  // For direct chats, show online status
  const otherParticipant = getOtherParticipant(chat, user?._id);
  const showOnlineIndicator = !chat.isGroupChat && otherParticipant && isUserOnline(otherParticipant._id, onlineUsers);

  // Unread count (to be implemented with message tracking)
  const unreadCount = 0; // TODO: Implement unread count tracking

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: theme.border },
        isPinned && { backgroundColor: theme.pinnedBackground || theme.surface }
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Profile Picture / Avatar */}
      <View style={styles.avatarContainer}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {chatName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {/* Online Indicator */}
        {showOnlineIndicator && (
          <View style={[styles.onlineIndicator, { backgroundColor: theme.onlineIndicator }]} />
        )}
      </View>

      {/* Chat Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            {isPinned && <Text style={styles.pinIcon}>📌</Text>}
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {chatName}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: theme.timestamp }]}>
            {timestamp}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            style={[styles.lastMessage, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {lastMessagePreview}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.unreadBadge }]}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pinIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConversationItem;
