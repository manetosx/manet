const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

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
        _id: user._id,
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
        _id: user._id,
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
        _id: user._id,
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

// Generate 6-digit code and send password reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with this email, a reset code has been sent' });
    }

    // Rate limiting: check if user requested reset in last 2 minutes
    if (user.lastPasswordResetRequest) {
      const timeSinceLastRequest = Date.now() - user.lastPasswordResetRequest.getTime();
      const cooldownPeriod = 2 * 60 * 1000; // 2 minutes

      if (timeSinceLastRequest < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastRequest) / 1000);
        return res.status(429).json({
          message: `Please wait ${remainingSeconds} seconds before requesting another code`
        });
      }
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code before storing
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Update user with reset code info
    user.resetPasswordCodeHash = codeHash;
    user.resetPasswordExpires = expiresAt;
    user.resetPasswordAttempts = 0;
    user.lastPasswordResetRequest = new Date();
    await user.save();

    // Send email
    const emailResult = await sendPasswordResetEmail(email, resetCode, user.username);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ message: 'If an account exists with this email, a reset code has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify the reset code and return a temporary token
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Check if code has expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    // Check brute-force protection (max 5 attempts)
    if (user.resetPasswordAttempts >= 5) {
      // Clear the reset code to force user to request a new one
      user.resetPasswordCodeHash = null;
      user.resetPasswordExpires = null;
      user.resetPasswordAttempts = 0;
      await user.save();

      return res.status(400).json({
        message: 'Too many failed attempts. Please request a new reset code.'
      });
    }

    // Hash the provided code and compare
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    if (codeHash !== user.resetPasswordCodeHash) {
      user.resetPasswordAttempts += 1;
      await user.save();

      const remainingAttempts = 5 - user.resetPasswordAttempts;
      return res.status(400).json({
        message: `Invalid code. ${remainingAttempts} attempts remaining.`
      });
    }

    // Code is valid - generate a temporary reset token
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Clear the code (one-time use)
    user.resetPasswordCodeHash = null;
    user.resetPasswordExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    res.json({
      message: 'Code verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password using the temporary token
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check token purpose
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
