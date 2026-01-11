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
      });

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
