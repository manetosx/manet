import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import api from '../services/api';
import { ENDPOINTS } from '../config/api';
import { isOwnMessage, generateTempMessageId, getOtherParticipant } from '../utils/messageHelpers';
import { formatLastSeen } from '../utils/dateFormatter';

const ChatScreen = ({ route, navigation }) => {
  const { chatId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const { emit, onlineUsers, isConnected, lastMessage, lastTypingEvent, lastReadEvent } = useWebSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const processedMessagesRef = useRef(new Set());

  // Fetch chat details
  useEffect(() => {
    fetchChat();
  }, [chatId]);

  // Fetch messages
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Mark all current messages as read when user focuses on this screen
      if (messages.length > 0) {
        markUnreadMessagesAsRead(messages);
      }
    });

    return unsubscribe;
  }, [navigation, messages]);

  // Handle incoming messages from WebSocket context
  useEffect(() => {
    if (!lastMessage) return;

    // Check if this message is for this chat
    if (lastMessage.chatId !== chatId) {
      console.log('⏭️ Message not for this chat:', lastMessage.chatId, 'vs', chatId);
      return;
    }

    // Check if we already processed this message (prevent duplicates)
    const messageKey = `${lastMessage._id}-${lastMessage._receivedAt}`;
    if (processedMessagesRef.current.has(messageKey)) {
      return;
    }
    processedMessagesRef.current.add(messageKey);

    // Only add message if it's from someone else
    const isOwnMsg = lastMessage.senderId === user?._id || lastMessage.senderId?._id === user?._id;
    console.log('📨 ChatScreen processing message:', lastMessage._id, 'isOwn:', isOwnMsg);

    if (!isOwnMsg) {
      console.log('✅ Adding message to chat');
      setMessages((prev) => {
        // Check if message already exists
        if (prev.some(m => m._id === lastMessage._id)) {
          return prev;
        }
        return [...prev, lastMessage];
      });

      // Mark as read
      if (lastMessage._id) {
        api.put(ENDPOINTS.MESSAGES.MARK_READ(lastMessage._id)).catch(err => {
          console.error('❌ Error marking message as read:', err);
        });
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [lastMessage, chatId, user]);

  // Handle typing events from WebSocket context
  useEffect(() => {
    if (!lastTypingEvent) return;

    if (lastTypingEvent.chatId === chatId && lastTypingEvent.userId !== user?._id) {
      setIsTyping(lastTypingEvent.typing);
    }
  }, [lastTypingEvent, chatId, user]);

  // Handle read receipts from WebSocket context
  useEffect(() => {
    if (!lastReadEvent) return;

    if (lastReadEvent.chatId === chatId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === lastReadEvent.messageId
            ? { ...msg, readBy: lastReadEvent.readBy }
            : msg
        )
      );
    }
  }, [lastReadEvent, chatId]);

  // Update header with online status or typing indicator
  useEffect(() => {
    if (!chat) return;

    // For group chats, show group info button
    if (chat.isGroupChat) {
      navigation.setOptions({
        headerTitle: chat.name || 'Group Chat',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupInfo', { chatId })}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: theme.primary, fontSize: 16 }}>ℹ️</Text>
          </TouchableOpacity>
        ),
      });
      return;
    }

    // For direct chats, show online status
    const otherParticipant = getOtherParticipant(chat, user?._id);
    if (!otherParticipant) return;

    const isOnline = onlineUsers.includes(otherParticipant._id);

    if (isTyping) {
      navigation.setOptions({
        headerTitle: `${otherParticipant.username}`,
        headerSubtitle: 'Typing...',
      });
    } else if (isOnline) {
      navigation.setOptions({
        headerTitle: `${otherParticipant.username}`,
        headerSubtitle: 'Active now',
      });
    } else {
      const lastSeenText = formatLastSeen(otherParticipant.lastSeen);
      navigation.setOptions({
        headerTitle: `${otherParticipant.username}`,
        headerSubtitle: lastSeenText,
      });
    }
  }, [chat, isTyping, onlineUsers, user, navigation, chatId, theme]);

  const fetchChat = async () => {
    try {
      const response = await api.get(ENDPOINTS.CHATS.BY_ID(chatId));
      setChat(response.data.chat);
    } catch (error) {
      console.error('Error fetching chat:', error);
      Alert.alert('Error', 'Failed to load chat details');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(ENDPOINTS.MESSAGES.BY_CHAT(chatId) + '?limit=50');
      const fetchedMessages = response.data.messages;
      setMessages(fetchedMessages);

      // Mark unread messages as read
      await markUnreadMessagesAsRead(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markUnreadMessagesAsRead = async (messagesToCheck) => {
    try {
      // Find messages that are not from current user and haven't been read yet
      const unreadMessages = messagesToCheck.filter(msg => {
        const isOwn = msg.senderId === user?._id || msg.senderId?._id === user?._id;
        if (isOwn) return false;

        // Check if current user has already read this message
        const alreadyRead = msg.readBy?.some(
          read => read.userId === user?._id || read.userId?._id === user?._id
        );
        return !alreadyRead && msg._id;
      });

      // Mark each unread message as read
      for (const msg of unreadMessages) {
        try {
          await api.put(ENDPOINTS.MESSAGES.MARK_READ(msg._id));
        } catch (error) {
          console.error('Error marking message as read:', msg._id, error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error('Error in markUnreadMessagesAsRead:', error);
    }
  };

  const handleSendMessage = async (text, type = 'text', mediaUrl = '') => {
    const tempId = generateTempMessageId();
    const tempMessage = {
      _id: tempId,
      chatId,
      content: text,
      senderId: user._id,
      type,
      mediaUrl,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    // Optimistically add message to UI
    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 1. Persist to database via REST API
      const payload = {
        chatId,
        content: text,
        type,
      };

      if (type === 'image' && mediaUrl) {
        payload.mediaUrl = mediaUrl;
      }

      const response = await api.post(ENDPOINTS.MESSAGES.SEND, payload);

      const savedMessage = response.data.message;

      // Backend now handles WebSocket emission to other participants

      // 2. Update message with server response
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? savedMessage : msg))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');

      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = isOwnMessage(item, user?._id);
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isOwn && (!previousMessage || isOwnMessage(previousMessage, user?._id));

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwn}
        showAvatar={showAvatar}
        isGroupChat={chat?.isGroupChat || false}
      />
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No messages yet
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
          Say hi to start the conversation!
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
      {/* Connection Status Banner */}
      {!isConnected && (
        <View style={[styles.connectionBanner, { backgroundColor: theme.warning }]}>
          <Text style={styles.connectionText}>Reconnecting...</Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id?.toString() || item.timestamp?.toString() || Math.random().toString()}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
        onLayout={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Message Input */}
      <MessageInput
        chatId={chatId}
        recipientId={getOtherParticipant(chat, user?._id)?._id}
        onSend={handleSendMessage}
      />
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
  connectionBanner: {
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    paddingVertical: 12,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChatScreen;
