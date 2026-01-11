const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        let existingUser = await User.findOne({ email: profile.emails[0].value });

        if (existingUser) {
          existingUser.googleId = profile.id;
          if (!existingUser.profilePicture && profile.photos && profile.photos.length > 0) {
            existingUser.profilePicture = profile.photos[0].value;
          }
          await existingUser.save();
          return done(null, existingUser);
        }

        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
          profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          isEmailVerified: true
        });

        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
    )
  );
} else {
  console.warn('⚠️  Google OAuth credentials not configured. Google Sign-In will be unavailable.');
}

module.exports = passport;
