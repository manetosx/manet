const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    const redirectUrl = process.env.MOBILE_APP_REDIRECT_URL || 'manet://auth/google/callback';

    res.redirect(`${redirectUrl}?token=${token}&userId=${req.user._id}`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.googleAuthMobile = async (req, res) => {
  try {
    const { idToken } = req.body;

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      let existingUser = await User.findOne({ email: payload.email });

      if (existingUser) {
        existingUser.googleId = payload.sub;
        if (!existingUser.profilePicture && payload.picture) {
          existingUser.profilePicture = payload.picture;
        }
        existingUser.isEmailVerified = true;
        await existingUser.save();
        user = existingUser;
      } else {
        user = await User.create({
          googleId: payload.sub,
          email: payload.email,
          username: payload.name || payload.email.split('@')[0],
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
          profilePicture: payload.picture || '',
          isEmailVerified: true
        });
      }
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};
