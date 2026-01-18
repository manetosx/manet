import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import ConversationItem from '../components/ConversationItem';
import ChatContextMenu from '../components/ChatContextMenu';
import UserMenu from '../components/UserMenu';
import api from '../services/api';
import { ENDPOINTS } from '../config/api';
import { sortChatsByRecent } from '../utils/messageHelpers';

const ConversationsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Setup header button callback
  useEffect(() => {
    navigation.setParams({
      toggleUserMenu: () => setUserMenuVisible(true),
    });
  }, [navigation]);

  // Listen for new messages via state from WebSocketContext
  useEffect(() => {
    if (!lastMessage) return;

    console.log('📨 ConversationsScreen received new message:', lastMessage._id);

    // Update chat list with new message
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat._id === lastMessage.chatId) {
          return {
            ...chat,
            lastMessage: lastMessage,
            updatedAt: lastMessage.createdAt || new Date(),
          };
        }
        return chat;
      });
      return sortChatsByRecent(updatedChats);
    });
  }, [lastMessage]);

  // Filter chats based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      const currentUserIdStr = user?._id?.toString();
      const filtered = chats.filter((chat) => {
        // Search in chat name or participants
        if (chat.isGroupChat) {
          return chat.name?.toLowerCase().includes(query);
        } else {
          // Direct chat: search in participant's username
          // Convert IDs to strings for comparison to handle ObjectId vs String
          const otherParticipant = chat.participants?.find(
            (p) => p._id?.toString() !== currentUserIdStr
          );
          return otherParticipant?.username?.toLowerCase().includes(query);
        }
      });
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats, user]);

  const sortChatsByPinnedAndRecent = (chatsToSort) => {
    const sorted = sortChatsByRecent(chatsToSort);
    // Sort by pinned status first, then by recent
    return sorted.sort((a, b) => {
      const aIsPinned = a.pinnedBy?.some(id => id.toString() === user?._id?.toString());
      const bIsPinned = b.pinnedBy?.some(id => id.toString() === user?._id?.toString());

      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get(ENDPOINTS.CHATS.LIST);
      const sortedChats = sortChatsByPinnedAndRecent(response.data.chats);
      setChats(sortedChats);
      setFilteredChats(sortedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat) => {
    navigation.navigate('Chat', {
      chatId: chat._id,
      chatName: getChatName(chat),
    });
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.name || 'Group Chat';
    }
    // Convert IDs to strings for comparison to handle ObjectId vs String
    const currentUserIdStr = user?._id?.toString();
    const otherParticipant = chat.participants?.find(
      (p) => p._id?.toString() !== currentUserIdStr
    );
    return otherParticipant?.username || 'Unknown User';
  };

  const handleNewChat = () => {
    setFabMenuVisible(false);
    navigation.navigate('NewChat');
  };

  const handleCreateGroup = () => {
    setFabMenuVisible(false);
    navigation.navigate('CreateGroup');
  };

  const toggleFabMenu = () => {
    setFabMenuVisible(!fabMenuVisible);
  };

  const handleLongPress = (chat) => {
    setSelectedChat(chat);
    setContextMenuVisible(true);
  };

  const handlePinChat = async () => {
    if (!selectedChat) return;

    try {
      await api.put(ENDPOINTS.CHATS.PIN(selectedChat._id));

      // Update local state
      const updatedChats = chats.map(chat => {
        if (chat._id === selectedChat._id) {
          const isPinned = chat.pinnedBy?.some(id => id.toString() === user?._id?.toString());
          if (isPinned) {
            // Unpin
            return {
              ...chat,
              pinnedBy: chat.pinnedBy.filter(id => id.toString() !== user?._id?.toString())
            };
          } else {
            // Pin
            return {
              ...chat,
              pinnedBy: [...(chat.pinnedBy || []), user._id]
            };
          }
        }
        return chat;
      });

      const sortedChats = sortChatsByPinnedAndRecent(updatedChats);
      setChats(sortedChats);
      setFilteredChats(sortedChats);
    } catch (error) {
      console.error('Error toggling pin:', error);
      Alert.alert('Error', 'Failed to pin/unpin chat');
    }
  };

  const handleMuteChat = async (duration) => {
    if (!selectedChat) return;

    try {
      if (duration === 'unmute') {
        // Unmute chat
        await api.delete(ENDPOINTS.CHATS.UNMUTE(selectedChat._id));

        // Update local state
        const updatedChats = chats.map(chat => {
          if (chat._id === selectedChat._id) {
            return {
              ...chat,
              mutedBy: (chat.mutedBy || []).filter(
                mute => mute.userId.toString() !== user?._id?.toString()
              )
            };
          }
          return chat;
        });

        setChats(updatedChats);
        setFilteredChats(updatedChats);
      } else {
        // Mute chat for specified duration
        const response = await api.put(ENDPOINTS.CHATS.MUTE(selectedChat._id), {
          duration
        });

        // Update local state
        const updatedChats = chats.map(chat => {
          if (chat._id === selectedChat._id) {
            const existingMutes = (chat.mutedBy || []).filter(
              mute => mute.userId.toString() !== user?._id?.toString()
            );
            return {
              ...chat,
              mutedBy: [
                ...existingMutes,
                {
                  userId: user._id,
                  mutedUntil: response.data.mutedUntil
                }
              ]
            };
          }
          return chat;
        });

        setChats(updatedChats);
        setFilteredChats(updatedChats);
      }
    } catch (error) {
      console.error('Error muting/unmuting chat:', error);
      Alert.alert('Error', 'Failed to mute/unmute chat');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(ENDPOINTS.CHATS.DELETE(selectedChat._id));

              // Remove from local state
              const updatedChats = chats.filter(chat => chat._id !== selectedChat._id);
              setChats(updatedChats);
              setFilteredChats(updatedChats);
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat');
            }
          }
        }
      ]
    );
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleLogoutPress = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(ENDPOINTS.AUTH.LOGOUT);
            } catch (error) {
              console.error('Error logging out:', error);
            }
            // Navigate to login screen (handled by AuthContext)
          }
        }
      ]
    );
  };

  const renderChatItem = ({ item }) => (
    <ConversationItem
      chat={item}
      onPress={() => handleChatPress(item)}
      onLongPress={() => handleLongPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
        Start chatting by tapping the + button
      </Text>
    </View>
  );

  const renderHeader = () => (
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
        placeholder="Search conversations..."
        placeholderTextColor={theme.inputPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Connection Status */}
      {!isConnected && (
        <View style={[styles.connectionBanner, { backgroundColor: theme.warning }]}>
          <Text style={styles.connectionText}>Connecting...</Text>
        </View>
      )}

      {/* Context Menu */}
      <ChatContextMenu
        visible={contextMenuVisible}
        onClose={() => setContextMenuVisible(false)}
        chat={selectedChat}
        onPin={handlePinChat}
        onMute={handleMuteChat}
        onDelete={handleDeleteChat}
        isPinned={selectedChat?.pinnedBy?.some(id => id.toString() === user?._id?.toString())}
        isMuted={selectedChat?.mutedBy?.some(mute => {
          const isMutedByUser = mute.userId?.toString() === user?._id?.toString();
          const isNotExpired = new Date(mute.mutedUntil) > new Date();
          return isMutedByUser && isNotExpired;
        })}
      />

      {/* User Menu */}
      <UserMenu
        visible={userMenuVisible}
        onClose={() => setUserMenuVisible(false)}
        onProfilePress={handleProfilePress}
        onSettingsPress={handleSettingsPress}
        onLogoutPress={handleLogoutPress}
      />

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={filteredChats.length === 0 && styles.emptyList}
      />

      {/* FAB Menu */}
      {fabMenuVisible && (
        <View style={[styles.fabMenu, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.fabMenuItem, { borderBottomColor: theme.border }]}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Text style={[styles.fabMenuText, { color: theme.text }]}>
              💬 New Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={handleCreateGroup}
            activeOpacity={0.7}
          >
            <Text style={[styles.fabMenuText, { color: theme.text }]}>
              👥 Create Group
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={toggleFabMenu}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>{fabMenuVisible ? '×' : '+'}</Text>
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
  connectionBanner: {
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  fabMenu: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 180,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  fabMenuItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  fabMenuText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ConversationsScreen;
