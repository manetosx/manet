/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncateText = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get chat name from chat object
 * For direct chats, returns the other participant's name
 * For group chats, returns the group name
 */
export const getChatName = (chat, currentUserId) => {
  if (!chat) return 'Unknown';

  if (chat.isGroupChat) {
    return chat.name || 'Group Chat';
  }

  // Direct chat: find the other participant
  // Convert IDs to strings for comparison to handle ObjectId vs String
  const currentUserIdStr = currentUserId?.toString();
  const otherParticipant = chat.participants?.find(
    (p) => p._id?.toString() !== currentUserIdStr
  );

  return otherParticipant?.username || 'Unknown User';
};

/**
 * Get chat profile picture
 * For direct chats, returns the other participant's profile picture
 * For group chats, returns the group picture
 */
export const getChatProfilePicture = (chat, currentUserId) => {
  if (!chat) return null;

  if (chat.isGroupChat) {
    return chat.groupPicture;
  }

  // Direct chat: find the other participant
  // Convert IDs to strings for comparison to handle ObjectId vs String
  const currentUserIdStr = currentUserId?.toString();
  const otherParticipant = chat.participants?.find(
    (p) => p._id?.toString() !== currentUserIdStr
  );

  return otherParticipant?.profilePicture || null;
};

/**
 * Get the other participant in a direct chat
 */
export const getOtherParticipant = (chat, currentUserId) => {
  if (!chat || !chat.participants) return null;

  if (chat.isGroupChat) return null;

  // Convert IDs to strings for comparison to handle ObjectId vs String
  const currentUserIdStr = currentUserId?.toString();
  return chat.participants.find((p) => p._id?.toString() !== currentUserIdStr);
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId, onlineUsers) => {
  if (!userId || !onlineUsers) return false;
  // Convert ID to string for comparison
  const userIdStr = userId?.toString();
  return onlineUsers.some(id => id?.toString() === userIdStr);
};

/**
 * Get message preview for conversation list
 */
export const getMessagePreview = (lastMessage, currentUserId) => {
  if (!lastMessage) return 'No messages yet';

  // Convert IDs to strings for comparison to handle ObjectId vs String
  const currentUserIdStr = currentUserId?.toString();
  const senderIdStr = (lastMessage.senderId?._id || lastMessage.senderId)?.toString();
  const isOwnMessage = senderIdStr === currentUserIdStr;
  const prefix = isOwnMessage ? 'You: ' : '';

  if (lastMessage.type === 'text') {
    return prefix + truncateText(lastMessage.content, 35);
  }

  // For other message types
  const typeLabels = {
    image: '📷 Photo',
    video: '🎥 Video',
    audio: '🎵 Audio',
    file: '📎 File',
  };

  return prefix + (typeLabels[lastMessage.type] || 'Message');
};

/**
 * Generate temporary message ID
 */
export const generateTempMessageId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if message is sent by current user
 */
export const isOwnMessage = (message, currentUserId) => {
  if (!message || !currentUserId) return false;
  // Convert IDs to strings for comparison to handle ObjectId vs String
  const currentUserIdStr = currentUserId?.toString();
  const senderIdStr = (message.senderId?._id || message.senderId)?.toString();
  return senderIdStr === currentUserIdStr;
};

/**
 * Get message status (for sent messages)
 * Returns: 'sending', 'sent', 'delivered', 'read', 'failed'
 */
export const getMessageStatus = (message) => {
  if (!message) return 'sending';

  if (message.status) return message.status;

  // Check if message has been read
  if (message.readBy && message.readBy.length > 0) {
    return 'read';
  }

  // If message has an ID from server, it's at least sent
  if (message._id && !message._id.toString().startsWith('temp_')) {
    return 'sent';
  }

  return 'sending';
};

/**
 * Sort chats by most recent message
 */
export const sortChatsByRecent = (chats) => {
  if (!chats) return [];

  return [...chats].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.updatedAt || a.createdAt;
    const bTime = b.lastMessage?.createdAt || b.updatedAt || b.createdAt;

    return new Date(bTime) - new Date(aTime);
  });
};
