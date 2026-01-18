import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatMessageBubbleTime } from '../utils/dateFormatter';
import { getMessageStatus } from '../utils/messageHelpers';

const MessageBubble = ({ message, isOwnMessage, showAvatar = true, isGroupChat = false }) => {
  const { theme } = useTheme();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const timestamp = formatMessageBubbleTime(message.createdAt || message.timestamp);
  const status = isOwnMessage ? getMessageStatus(message) : null;

  // Get sender info for received messages
  const senderName = message.senderId?.username || 'Unknown';
  const senderAvatar = message.senderId?.profilePicture;

  // Get read by names for group chats
  const getReadByNames = () => {
    if (!message.readBy || message.readBy.length === 0) return '';

    const names = message.readBy
      .map(read => read.userId?.username || read.username)
      .filter(Boolean);

    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} others`;
  };

  // Read receipt indicators
  const renderReadReceipt = () => {
    if (!status || status === 'sending') return null;

    const getCheckmarks = () => {
      switch (status) {
        case 'sent':
          return '✓';
        case 'delivered':
          return '✓✓';
        case 'read':
          return '✓✓';
        default:
          return null;
      }
    };

    const checkmarks = getCheckmarks();
    if (!checkmarks) return null;

    return (
      <Text
        style={[
          styles.readReceipt,
          {
            color: status === 'read' ? theme.primary : theme.timestamp,
          },
        ]}
      >
        {checkmarks}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {/* Avatar for received messages */}
      {!isOwnMessage && showAvatar && (
        <View style={styles.avatarContainer}>
          {senderAvatar ? (
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(true)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: senderAvatar }} style={styles.avatar} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Spacer when no avatar */}
      {!isOwnMessage && !showAvatar && <View style={styles.avatarSpacer} />}

      {/* Message Bubble */}
      <View style={styles.bubbleContainer}>
        <View
          style={[
            styles.bubble,
            isOwnMessage
              ? {
                  backgroundColor: theme.messageSent,
                  borderBottomRightRadius: 4,
                }
              : {
                  backgroundColor: theme.messageReceived,
                  borderBottomLeftRadius: 4,
                },
            message.type === 'image' && styles.imageBubble,
          ]}
        >
          {/* Image Message */}
          {message.type === 'image' && message.mediaUrl && (
            <TouchableOpacity
              onPress={() => setImageModalVisible(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: message.mediaUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              {message.content ? (
                <Text
                  style={[
                    styles.messageText,
                    styles.imageCaption,
                    {
                      color: isOwnMessage
                        ? theme.messageSentText
                        : theme.messageReceivedText,
                    },
                  ]}
                >
                  {message.content}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}

          {/* Text Message */}
          {message.type === 'text' && (
            <Text
              style={[
                styles.messageText,
                {
                  color: isOwnMessage
                    ? theme.messageSentText
                    : theme.messageReceivedText,
                },
              ]}
            >
              {message.content}
            </Text>
          )}
        </View>

        {/* Timestamp and Read Receipt */}
        <View
          style={[
            styles.footer,
            isOwnMessage ? styles.footerOwn : styles.footerOther,
          ]}
        >
          <Text style={[styles.timestamp, { color: theme.timestamp }]}>
            {timestamp}
          </Text>
          {renderReadReceipt()}
        </View>

        {/* Group chat read by indicator */}
        {isOwnMessage && isGroupChat && status === 'read' && (
          <View style={styles.readByContainer}>
            <Text style={[styles.readByText, { color: theme.textSecondary }]}>
              Seen by {getReadByNames()}
            </Text>
          </View>
        )}
      </View>

      {/* Full-size Image Modal */}
      {message.type === 'image' && message.mediaUrl && (
        <Modal
          visible={imageModalVisible}
          transparent={true}
          onRequestClose={() => setImageModalVisible(false)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setImageModalVisible(false)}
            >
              <Image
                source={{ uri: message.mediaUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Avatar Modal */}
      {!isOwnMessage && senderAvatar && (
        <Modal
          visible={avatarModalVisible}
          transparent={true}
          onRequestClose={() => setAvatarModalVisible(false)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Image
                source={{ uri: senderAvatar }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAvatarModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 40,
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  footerOwn: {
    justifyContent: 'flex-end',
  },
  footerOther: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 12,
    marginRight: 4,
  },
  readReceipt: {
    fontSize: 12,
    fontWeight: '600',
  },
  readByContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  readByText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  imageBubble: {
    padding: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageCaption: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});

export default MessageBubble;
