const User = require('../models/User');
const Chat = require('../models/Chat');
const { sendNotification, sendMulticastNotification, isInitialized } = require('../config/firebase');

/**
 * Check if a chat is muted for a specific user
 */
const isChatMuted = (chat, userId) => {
  if (!chat.mutedBy || chat.mutedBy.length === 0) {
    return false;
  }

  const muteSettings = chat.mutedBy.find(
    mute => mute.userId.toString() === userId.toString()
  );

  if (!muteSettings || !muteSettings.mutedUntil) {
    return false;
  }

  // Check if mute period has expired
  return new Date() < new Date(muteSettings.mutedUntil);
};

/**
 * Send notification for a new message
 */
const sendMessageNotification = async (message, chat, sender) => {
  console.log('🔔 sendMessageNotification called');

  if (!isInitialized()) {
    console.log('⚠️  Firebase not initialized, skipping notification');
    return;
  }

  try {
    // Get all participants except the sender
    const recipientIds = chat.participants.filter(
      participantId => participantId.toString() !== sender._id.toString()
    );

    console.log('📋 Recipient IDs (excluding sender):', recipientIds.map(r => r.toString()));

    if (recipientIds.length === 0) {
      console.log('⚠️  No recipients found');
      return;
    }

    // Fetch users with FCM tokens
    const recipients = await User.find({
      _id: { $in: recipientIds },
      fcmToken: { $ne: '' }
    });

    console.log('📱 Recipients with FCM tokens:', recipients.map(r => ({ id: r._id.toString(), username: r.username, hasToken: !!r.fcmToken })));

    if (recipients.length === 0) {
      console.log('⚠️  No recipients have FCM tokens registered');
      return;
    }

    // Filter out users who have muted this chat
    const unmutedRecipients = recipients.filter(recipient =>
      !isChatMuted(chat, recipient._id)
    );

    console.log('🔕 Unmuted recipients:', unmutedRecipients.map(r => r.username));

    if (unmutedRecipients.length === 0) {
      console.log('⚠️  All recipients have muted this chat');
      return;
    }

    // Prepare notification payload
    const isGroupChat = chat.isGroupChat;
    const title = isGroupChat
      ? `${chat.name || 'Group Chat'}`
      : sender.username;

    let body;
    if (message.type === 'text') {
      body = isGroupChat
        ? `${sender.username}: ${message.content}`
        : message.content;
    } else if (message.type === 'image') {
      body = isGroupChat
        ? `${sender.username} sent an image`
        : 'Sent an image';
    } else {
      body = isGroupChat
        ? `${sender.username} sent a message`
        : 'New message';
    }

    const payload = {
      title,
      body,
      data: {
        type: 'message',
        chatId: chat._id.toString(),
        messageId: message._id.toString(),
        senderId: sender._id.toString(),
        senderName: sender.username,
        isGroupChat: isGroupChat.toString()
      }
    };

    // Send notifications
    const tokens = unmutedRecipients.map(user => user.fcmToken);

    console.log('🚀 Sending notifications to', tokens.length, 'device(s)');
    console.log('📦 Notification payload:', JSON.stringify(payload, null, 2));

    if (tokens.length === 1) {
      const result = await sendNotification(tokens[0], payload);
      console.log('✅ Notification sent successfully:', result);
    } else {
      const result = await sendMulticastNotification(tokens, payload);
      console.log('✅ Multicast notification sent successfully:', result);
    }
  } catch (error) {
    console.error('❌ Error sending message notification:', error.message);
    console.error('Stack:', error.stack);
  }
};

module.exports = {
  sendMessageNotification,
  isChatMuted
};
