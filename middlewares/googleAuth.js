import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import config from '../config/config.js';

import crypto from 'crypto';

const configurePassport = () => {
    passport.use(new GoogleStrategy({
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: config.googleCallbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
              user = new User({
                fullName: profile.displayName,
                username: profile.emails[0].value.split('@')[0], // Use part of email as username
                email: profile.emails[0].value,
                password: crypto.randomBytes(16).toString('hex'), // Generate random password
                authProvider: 'google',
                isVerified: true
              });
              await user.save();
            }

            return done(null, user);

            } catch (err) {
            return done(err, null);
            }
        }
    ));

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
      const user = await User.findById(id);
      done(null, user);
    });
};

export { configurePassport };
export default passport;