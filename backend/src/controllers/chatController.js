const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.createChat = async (req, res) => {
  try {
    const { participantIds, isGroupChat, name } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: 'Participants are required' });
    }

    const allParticipants = [...new Set([req.user._id.toString(), ...participantIds])];

    if (!isGroupChat && allParticipants.length !== 2) {
      return res.status(400).json({ message: 'Direct chat must have exactly 2 participants' });
    }

    if (!isGroupChat) {
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: allParticipants, $size: 2 }
      }).populate('participants', 'username profilePicture isOnline lastSeen');

      if (existingChat) {
        return res.json({ chat: existingChat });
      }
    }

    const chat = await Chat.create({
      participants: allParticipants,
      isGroupChat,
      name: isGroupChat ? name : undefined,
      admin: isGroupChat ? req.user._id : undefined
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'username profilePicture isOnline lastSeen');

    res.status(201).json({ chat: populatedChat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username profilePicture isOnline lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'username profilePicture isOnline lastSeen')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addParticipants = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { participantIds } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Cannot add participants to direct chat' });
    }

    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add participants' });
    }

    const newParticipants = participantIds.filter(
      id => !chat.participants.includes(id)
    );

    chat.participants.push(...newParticipants);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'username profilePicture isOnline lastSeen');

    res.json({ chat: updatedChat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const { chatId, participantId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Cannot remove participants from direct chat' });
    }

    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove participants' });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot remove themselves. Use leave group instead.' });
    }

    chat.participants = chat.participants.filter(
      p => p.toString() !== participantId
    );

    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', 'username profilePicture isOnline lastSeen');

    res.json({
      message: 'Participant removed successfully',
      chat: updatedChat
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.leaveChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Cannot leave direct chat' });
    }

    chat.participants = chat.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      await Message.deleteMany({ chatId });
      return res.json({ message: 'Chat deleted as last participant left' });
    }

    if (chat.admin.toString() === req.user._id.toString()) {
      chat.admin = chat.participants[0];
    }

    await chat.save();
    res.json({ message: 'Left chat successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Toggle pin status
    const isPinned = chat.pinnedBy.some(id => id.toString() === req.user._id.toString());

    if (isPinned) {
      // Unpin
      chat.pinnedBy = chat.pinnedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Pin
      chat.pinnedBy.push(req.user._id);
    }

    await chat.save();

    res.json({
      message: isPinned ? 'Chat unpinned' : 'Chat pinned',
      isPinned: !isPinned
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.muteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { duration } = req.body; // duration in hours (1, 2, 8) or 'forever'

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Calculate mute expiry time
    let mutedUntil;
    if (duration === 'forever') {
      // Set to a far future date (100 years from now)
      mutedUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
    } else {
      const hours = parseInt(duration);
      if (isNaN(hours) || hours <= 0) {
        return res.status(400).json({ message: 'Invalid duration' });
      }
      mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    // Remove existing mute setting for this user if any
    chat.mutedBy = chat.mutedBy.filter(
      mute => mute.userId.toString() !== req.user._id.toString()
    );

    // Add new mute setting
    chat.mutedBy.push({
      userId: req.user._id,
      mutedUntil
    });

    await chat.save();

    res.json({
      message: 'Chat muted successfully',
      mutedUntil
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unmuteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove mute setting for this user
    chat.mutedBy = chat.mutedBy.filter(
      mute => mute.userId.toString() !== req.user._id.toString()
    );

    await chat.save();

    res.json({ message: 'Chat unmuted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // For direct chats, just remove the user from participants (soft delete for them)
    if (!chat.isGroupChat) {
      chat.participants = chat.participants.filter(
        p => p.toString() !== req.user._id.toString()
      );

      // If no participants left, delete the chat and messages
      if (chat.participants.length === 0) {
        await Chat.findByIdAndDelete(chatId);
        await Message.deleteMany({ chatId });
        return res.json({ message: 'Chat deleted successfully' });
      }

      await chat.save();
      return res.json({ message: 'Chat deleted successfully' });
    }

    // For group chats, use the same logic as leaveChat
    chat.participants = chat.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      await Message.deleteMany({ chatId });
      return res.json({ message: 'Chat deleted successfully' });
    }

    if (chat.admin.toString() === req.user._id.toString()) {
      chat.admin = chat.participants[0];
    }

    await chat.save();
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
