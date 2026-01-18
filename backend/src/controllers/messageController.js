const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { sendMessageNotification } = require('../services/notificationService');

// Get io instance from server
let io;
const setIO = (ioInstance) => {
  io = ioInstance;
};

// Helper to get online users map
const getOnlineUsers = () => {
  if (!io) return new Map();
  // Access the onlineUsers from socket config
  return io.onlineUsers || new Map();
};

exports.setIO = setIO;

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content, type, mediaUrl } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await Message.create({
      chatId,
      senderId: req.user._id,
      content,
      type: type || 'text',
      mediaUrl
    });

    chat.lastMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username profilePicture');

    // Emit via WebSocket to other participants
    const onlineUserIds = [];
    if (io) {
      const onlineUsers = getOnlineUsers();
      console.log('📡 Online users:', Array.from(onlineUsers.keys()));
      console.log('📤 Sending message to chat participants:', chat.participants.map(p => p.toString()));

      chat.participants.forEach(participantId => {
        if (participantId.toString() !== req.user._id.toString()) {
          const socketId = onlineUsers.get(participantId.toString());
          console.log(`👤 Participant ${participantId}: socketId=${socketId}`);
          if (socketId) {
            onlineUserIds.push(participantId.toString());
            io.to(socketId).emit('message:received', populatedMessage);
            console.log(`✅ Emitted message:received to ${participantId} via socket ${socketId}`);
          }
        }
      });
    }

    // Send push notifications to offline users
    // Only send if user is not currently online in the chat
    const offlineParticipants = chat.participants.filter(
      participantId =>
        participantId.toString() !== req.user._id.toString() &&
        !onlineUserIds.includes(participantId.toString())
    );

    console.log('📱 Offline participants for push notifications:', offlineParticipants.map(p => p.toString()));

    if (offlineParticipants.length > 0) {
      // Send notification asynchronously (don't wait for it)
      console.log('🔔 Sending push notifications to', offlineParticipants.length, 'offline users');
      sendMessageNotification(message, chat, req.user).catch(err =>
        console.error('❌ Notification error:', err.message)
      );
    } else {
      console.log('✋ No offline participants, skipping push notifications');
    }

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = { chatId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'username profilePicture')
      .populate('readBy.userId', 'username profilePicture');

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate('senderId', 'username profilePicture');
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const alreadyRead = message.readBy.some(
      read => read.userId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ userId: req.user._id });
      await message.save();

      // Get the chat to find all participants
      const chat = await Chat.findById(message.chatId);

      // Populate readBy with user details for display
      const populatedMessage = await Message.findById(message._id)
        .populate('readBy.userId', 'username profilePicture');

      // Emit read receipt to ALL participants in the chat (for group visibility)
      if (io && chat) {
        const onlineUsers = getOnlineUsers();

        chat.participants.forEach(participantId => {
          // Don't send to the person who just read it
          if (participantId.toString() !== req.user._id.toString()) {
            const socketId = onlineUsers.get(participantId.toString());
            if (socketId) {
              io.to(socketId).emit('message:read', {
                messageId: message._id,
                readBy: populatedMessage.readBy,
                chatId: message.chatId,
                readByUserId: req.user._id
              });
            }
          }
        });
      }
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
