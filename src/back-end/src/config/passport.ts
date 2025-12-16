import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { authService } from '../services/auth/authService';

/**
 * Passport.js Configuration
 *
 * INTEGRATION NOTE:
 * - Uses local strategy for username/password authentication
 * - Session-based authentication (not JWT)
 * - User is serialized by ID into session
 * - 2FA verification happens AFTER initial login (see auth routes)
 */

// Configure local strategy for username/password
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Find user by username
      const user = await authService.findByUsername(username);

      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Verify password
      const isValidPassword = await authService.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Return user (without password)
      return done(null, { id: user.id, username: user.username });
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user ID into session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authService.findById(id);

    if (!user) {
      return done(null, false);
    }

    // Return user without password
    return done(null, {
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    return done(error);
  }
});

export default passport;
