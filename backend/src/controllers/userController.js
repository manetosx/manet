const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }
    }).select('username email profilePicture status isOnline lastSeen').limit(100);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, status, profilePicture } = req.body;

    if (username) req.user.username = username;
    if (status) req.user.status = status;
    if (profilePicture) req.user.profilePicture = profilePicture;

    await req.user.save();

    res.json({ message: 'Profile updated', user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    req.user.fcmToken = fcmToken;
    await req.user.save();

    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('username email profilePicture isOnline lastSeen').limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('username email profilePicture status isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user account and all associated data
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    console.log('Delete account request body:', req.body);
    console.log('Password received:', password, 'Type:', typeof password);

    // Get user with password field for verification
    const userWithPassword = await User.findById(userId);

    // For users with a password (non-Google users), require password confirmation
    if (userWithPassword.password && !userWithPassword.googleId) {
      if (!password || password === null || password === '') {
        return res.status(400).json({ message: 'Password is required to delete account' });
      }

      const isPasswordValid = await userWithPassword.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    // Delete all messages sent by this user
    await Message.deleteMany({ sender: userId });

    // Remove user from all chat participants
    await Chat.updateMany(
      { participants: userId },
      { $pull: { participants: userId, pinnedBy: userId } }
    );

    // Remove user from mutedBy arrays
    await Chat.updateMany(
      { 'mutedBy.userId': userId },
      { $pull: { mutedBy: { userId: userId } } }
    );

    // Delete chats where user is the only participant (1-on-1 chats that become empty)
    const emptyChats = await Chat.find({
      isGroupChat: false,
      $or: [
        { participants: { $size: 0 } },
        { participants: { $size: 1 } }
      ]
    });

    for (const chat of emptyChats) {
      await Message.deleteMany({ chat: chat._id });
      await Chat.findByIdAndDelete(chat._id);
    }

    // For group chats where user is admin, transfer admin to another participant
    const adminChats = await Chat.find({ admin: userId, isGroupChat: true });
    for (const chat of adminChats) {
      if (chat.participants.length > 0) {
        // Transfer admin to first remaining participant
        const newAdmin = chat.participants.find(p => !p.equals(userId));
        if (newAdmin) {
          chat.admin = newAdmin;
          await chat.save();
        }
      }
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
